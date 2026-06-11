import { getDatabase, queryAll, queryFirst, tableCount, withTransaction } from "./database.js";
import { createSessionToken, hashPassword, hashSessionToken, nowIso, sessionTtlSeconds, verifyPassword } from "./auth.js";
import type { ActivityLog, AuthSession, AuthSessionState, AuthUser, UserRole } from "./types.js";

type QueryParams = Record<string, string | number | null> | (string | number | null)[];
type SqlDatabase = Awaited<ReturnType<typeof getDatabase>>;

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email: string | null;
  author_title: string;
  author_bio: string;
  role: UserRole;
  is_active: number;
  must_change_password: number;
  created_by_user_id: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  last_seen_at: string;
  revoked_at: string | null;
  created_at: string;
  created_ip: string | null;
  user_agent: string | null;
};

let bootstrapPromise: Promise<void> | null = null;

function dbAll<T extends Record<string, unknown>>(db: SqlDatabase, sql: string, params?: QueryParams) {
  const statement = db.prepare(sql, params as never);
  const rows: T[] = [];

  try {
    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
  } finally {
    statement.free();
  }

  return rows;
}

function dbFirst<T extends Record<string, unknown>>(db: SqlDatabase, sql: string, params?: QueryParams) {
  return dbAll<T>(db, sql, params)[0] ?? null;
}

function serializeUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    authorTitle: row.author_title ?? "",
    authorBio: row.author_bio ?? "",
    role: row.role,
    isActive: Boolean(row.is_active),
    mustChangePassword: Boolean(row.must_change_password),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeSession(row: SessionRow): AuthSession {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    createdIp: row.created_ip,
    userAgent: row.user_agent
  };
}

function writeActivityLog(db: SqlDatabase, log: ActivityLog) {
  db.run(`
    INSERT INTO activity_logs (
      id, actor_user_id, event_type, target_type, target_id, payload_json, created_at
    ) VALUES (
      $id, $actorUserId, $eventType, $targetType, $targetId, $payloadJson, $createdAt
    )
  `, {
    $id: log.id,
    $actorUserId: log.actorUserId,
    $eventType: log.eventType,
    $targetType: log.targetType,
    $targetId: log.targetId,
    $payloadJson: JSON.stringify(log.payload ?? null),
    $createdAt: log.createdAt
  } as never);
}

async function ensureBootstrapSuperAdmin() {
  bootstrapPromise ??= (async () => {
    const userCount = await tableCount("users");
    if (userCount > 0) {
      return;
    }

    const username = (process.env.BOOTSTRAP_SUPERADMIN_USERNAME ?? "admin").trim();
    const password = (process.env.BOOTSTRAP_SUPERADMIN_PASSWORD ?? "1").trim();
    const fullName = (process.env.BOOTSTRAP_SUPERADMIN_FULL_NAME ?? "Super Admin").trim();
    const createdAt = nowIso();
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await withTransaction((db) => {
      db.run(`
        INSERT INTO users (
          id, username, password_hash, full_name, email, author_title, author_bio, role, is_active,
          must_change_password, created_by_user_id, last_login_at, created_at, updated_at
        ) VALUES (
          $id, $username, $passwordHash, $fullName, NULL, '', '', 'super_admin', 1,
          0, NULL, NULL, $createdAt, $createdAt
        )
      `, {
        $id: userId,
        $username: username,
        $passwordHash: passwordHash,
        $fullName: fullName,
        $createdAt: createdAt
      } as never);

      writeActivityLog(db, {
        id: crypto.randomUUID(),
        actorUserId: null,
        eventType: "bootstrap_super_admin",
        targetType: "user",
        targetId: userId,
        payload: { username },
        createdAt
      });
    });
  })();

  return bootstrapPromise;
}

async function readUserRowById(db: SqlDatabase, userId: string) {
  return dbFirst<UserRow>(db, `
    SELECT *
    FROM users
    WHERE id = $userId
  `, { $userId: userId });
}

async function revokeAllUserSessionsInDb(db: SqlDatabase, userId: string) {
  db.run(`
    UPDATE sessions
    SET revoked_at = $revokedAt
    WHERE user_id = $userId
      AND revoked_at IS NULL
  `, {
    $userId: userId,
    $revokedAt: nowIso()
  } as never);
}

export async function authenticateUser(input: {
  username: string;
  password: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  await ensureBootstrapSuperAdmin();

  const db = await getDatabase();
  const userRow = dbFirst<UserRow>(db, `
    SELECT *
    FROM users
    WHERE username = $username
    LIMIT 1
  `, { $username: input.username.trim() });

  if (!userRow) {
    throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
  }

  if (!userRow.is_active) {
    throw new Error("Tài khoản đã bị khóa.");
  }

  const passwordOk = await verifyPassword(input.password, userRow.password_hash);
  if (!passwordOk) {
    throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
  }

  const user = serializeUser(userRow);
  const sessionToken = createSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + sessionTtlSeconds * 1000).toISOString();
  const sessionId = crypto.randomUUID();

  await withTransaction((tx) => {
    tx.run(`
      INSERT INTO sessions (
        id, user_id, token_hash, expires_at, last_seen_at, revoked_at, created_at, created_ip, user_agent
      ) VALUES (
        $id, $userId, $tokenHash, $expiresAt, $lastSeenAt, NULL, $createdAt, $createdIp, $userAgent
      )
    `, {
      $id: sessionId,
      $userId: user.id,
      $tokenHash: tokenHash,
      $expiresAt: expiresAt,
      $lastSeenAt: createdAt,
      $createdAt: createdAt,
      $createdIp: input.ipAddress,
      $userAgent: input.userAgent
    } as never);

    tx.run(`
      UPDATE users
      SET last_login_at = $lastLoginAt,
          updated_at = $updatedAt
      WHERE id = $userId
    `, {
      $lastLoginAt: createdAt,
      $updatedAt: createdAt,
      $userId: user.id
    } as never);

    writeActivityLog(tx, {
      id: crypto.randomUUID(),
      actorUserId: user.id,
      eventType: "session_login",
      targetType: "session",
      targetId: sessionId,
      payload: {
        createdIp: input.ipAddress,
        userAgent: input.userAgent
      },
      createdAt
    });
  });

  return {
    user: {
      ...user,
      lastLoginAt: createdAt
    },
    sessionToken
  };
}

export async function readAuthSessionState(token: string) {
  await ensureBootstrapSuperAdmin();
  const tokenHash = hashSessionToken(token);
  const row = await queryFirst<{
    session_id: string;
    user_id: string;
    token_hash: string;
    expires_at: string;
    last_seen_at: string;
    revoked_at: string | null;
    session_created_at: string;
    created_ip: string | null;
    user_agent: string | null;
    username: string;
    password_hash: string;
    full_name: string;
    email: string | null;
    author_title: string;
    author_bio: string;
    role: UserRole;
    is_active: number;
    must_change_password: number;
    created_by_user_id: string | null;
    last_login_at: string | null;
    user_created_at: string;
    user_updated_at: string;
  }>(`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.token_hash,
      s.expires_at,
      s.last_seen_at,
      s.revoked_at,
      s.created_at AS session_created_at,
      s.created_ip,
      s.user_agent,
      u.username,
      u.password_hash,
      u.full_name,
      u.email,
      u.author_title,
      u.author_bio,
      u.role,
      u.is_active,
      u.must_change_password,
      u.created_by_user_id,
      u.last_login_at,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $tokenHash
      AND s.revoked_at IS NULL
      AND s.expires_at > $now
    LIMIT 1
  `, {
    $tokenHash: tokenHash,
    $now: nowIso()
  });

  if (!row || !row.is_active) {
    return null;
  }

  const userRow: UserRow = {
    id: row.user_id,
    username: row.username,
    password_hash: row.password_hash,
    full_name: row.full_name,
    email: row.email,
    author_title: row.author_title ?? "",
    author_bio: row.author_bio ?? "",
    role: row.role,
    is_active: Number(row.is_active),
    must_change_password: Number(row.must_change_password),
    created_by_user_id: row.created_by_user_id,
    last_login_at: row.last_login_at,
    created_at: row.user_created_at,
    updated_at: row.user_updated_at
  };

  const sessionRow: SessionRow = {
    id: row.session_id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: row.expires_at,
    last_seen_at: row.last_seen_at,
    revoked_at: row.revoked_at,
    created_at: row.session_created_at,
    created_ip: row.created_ip,
    user_agent: row.user_agent
  };

  return {
    user: serializeUser(userRow),
    session: serializeSession(sessionRow)
  } satisfies AuthSessionState;
}

export async function touchSession(sessionId: string) {
  await ensureBootstrapSuperAdmin();
  await withTransaction((db) => {
    db.run(`
      UPDATE sessions
      SET last_seen_at = $lastSeenAt
      WHERE id = $sessionId
        AND revoked_at IS NULL
    `, {
      $lastSeenAt: nowIso(),
      $sessionId: sessionId
    } as never);
  });
}

export async function logoutSession(token: string) {
  await ensureBootstrapSuperAdmin();
  const tokenHash = hashSessionToken(token);
  await withTransaction((db) => {
    const session = dbFirst<SessionRow>(db, `
      SELECT *
      FROM sessions
      WHERE token_hash = $tokenHash
      LIMIT 1
    `, { $tokenHash: tokenHash });

    if (!session) {
      return;
    }

    const revokedAt = nowIso();
    db.run(`
      UPDATE sessions
      SET revoked_at = $revokedAt
      WHERE id = $sessionId
    `, {
      $revokedAt: revokedAt,
      $sessionId: session.id
    } as never);

    writeActivityLog(db, {
      id: crypto.randomUUID(),
      actorUserId: session.user_id,
      eventType: "session_logout",
      targetType: "session",
      targetId: session.id,
      payload: null,
      createdAt: revokedAt
    });
  });
}

export async function changeOwnPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  await ensureBootstrapSuperAdmin();
  if (input.newPassword.trim().length < 8) {
    throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự.");
  }

  const db = await getDatabase();
  const userRow = await readUserRowById(db, input.userId);
  if (!userRow) {
    throw new Error("Không tìm thấy tài khoản.");
  }

  const ok = await verifyPassword(input.currentPassword, userRow.password_hash);
  if (!ok) {
    throw new Error("Mật khẩu hiện tại không đúng.");
  }

  const passwordHash = await hashPassword(input.newPassword);
  const updatedAt = nowIso();

  await withTransaction((tx) => {
    tx.run(`
      UPDATE users
      SET password_hash = $passwordHash,
          must_change_password = 0,
          updated_at = $updatedAt
      WHERE id = $userId
    `, {
      $passwordHash: passwordHash,
      $updatedAt: updatedAt,
      $userId: input.userId
    } as never);

    writeActivityLog(tx, {
      id: crypto.randomUUID(),
      actorUserId: input.userId,
      eventType: "change_password",
      targetType: "user",
      targetId: input.userId,
      payload: null,
      createdAt: updatedAt
    });
  });
}

export async function readUsers() {
  await ensureBootstrapSuperAdmin();
  const rows = await queryAll<UserRow>(`
    SELECT *
    FROM users
    ORDER BY created_at ASC
  `);

  return rows.map(serializeUser);
}

export async function createAdminUser(input: {
  actorUserId: string;
  username: string;
  fullName: string;
  email?: string | null;
  authorTitle?: string | null;
  authorBio?: string | null;
  temporaryPassword: string;
}) {
  await ensureBootstrapSuperAdmin();

  const username = input.username.trim();
  const fullName = input.fullName.trim();
  const email = input.email?.trim() || null;
  const authorTitle = input.authorTitle?.trim() ?? "";
  const authorBio = input.authorBio?.trim() ?? "";
  const temporaryPassword = input.temporaryPassword.trim();

  if (!username || !fullName || temporaryPassword.length < 8) {
    throw new Error("Thiếu dữ liệu tạo tài khoản hoặc mật khẩu tạm quá ngắn.");
  }

  const existing = await queryFirst<UserRow>(`
    SELECT *
    FROM users
    WHERE username = $username
    LIMIT 1
  `, { $username: username });

  if (existing) {
    throw new Error("Tên đăng nhập đã tồn tại.");
  }

  const passwordHash = await hashPassword(temporaryPassword);
  const createdAt = nowIso();
  const userId = crypto.randomUUID();

  await withTransaction((db) => {
    db.run(`
      INSERT INTO users (
        id, username, password_hash, full_name, email, author_title, author_bio, role, is_active,
        must_change_password, created_by_user_id, last_login_at, created_at, updated_at
      ) VALUES (
        $id, $username, $passwordHash, $fullName, $email, $authorTitle, $authorBio, 'admin', 1,
        1, $createdByUserId, NULL, $createdAt, $createdAt
      )
    `, {
      $id: userId,
      $username: username,
      $passwordHash: passwordHash,
      $fullName: fullName,
      $email: email,
      $authorTitle: authorTitle,
      $authorBio: authorBio,
      $createdByUserId: input.actorUserId,
      $createdAt: createdAt
    } as never);

    writeActivityLog(db, {
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      eventType: "create_user",
      targetType: "user",
      targetId: userId,
      payload: {
        username,
        role: "admin"
      },
      createdAt
    });
  });

  return {
    id: userId,
    username,
    fullName,
    email,
    authorTitle,
    authorBio,
    role: "admin" as const,
    isActive: true,
    mustChangePassword: true,
    lastLoginAt: null,
    createdAt,
    updatedAt: createdAt
  } satisfies AuthUser;
}

export async function updateManagedUser(input: {
  actorUserId: string;
  userId: string;
  fullName?: string;
  email?: string | null;
  authorTitle?: string | null;
  authorBio?: string | null;
  isActive?: boolean;
}) {
  await ensureBootstrapSuperAdmin();

  const db = await getDatabase();
  const existing = await readUserRowById(db, input.userId);
  if (!existing) {
    throw new Error("Không tìm thấy user cần cập nhật.");
  }

  const nextFullName = input.fullName?.trim() || existing.full_name;
  const nextEmail = input.email === undefined ? existing.email : (input.email?.trim() || null);
  const nextAuthorTitle = input.authorTitle === undefined ? existing.author_title : (input.authorTitle?.trim() ?? "");
  const nextAuthorBio = input.authorBio === undefined ? existing.author_bio : (input.authorBio?.trim() ?? "");
  const nextIsActive = input.isActive === undefined ? Boolean(existing.is_active) : input.isActive;
  const updatedAt = nowIso();

  await withTransaction((tx) => {
    tx.run(`
      UPDATE users
      SET full_name = $fullName,
          email = $email,
          author_title = $authorTitle,
          author_bio = $authorBio,
          is_active = $isActive,
          updated_at = $updatedAt
      WHERE id = $userId
    `, {
      $fullName: nextFullName,
      $email: nextEmail,
      $authorTitle: nextAuthorTitle,
      $authorBio: nextAuthorBio,
      $isActive: nextIsActive ? 1 : 0,
      $updatedAt: updatedAt,
      $userId: input.userId
    } as never);

    if (!nextIsActive) {
      revokeAllUserSessionsInDb(tx, input.userId);
    }

    writeActivityLog(tx, {
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      eventType: nextIsActive ? "reactivate_user" : "deactivate_user",
      targetType: "user",
      targetId: input.userId,
      payload: {
        fullName: nextFullName,
        email: nextEmail,
        authorTitle: nextAuthorTitle,
        authorBio: nextAuthorBio
      },
      createdAt: updatedAt
    });
  });

  return {
    ...serializeUser(existing),
    fullName: nextFullName,
    email: nextEmail,
    authorTitle: nextAuthorTitle,
    authorBio: nextAuthorBio,
    isActive: nextIsActive,
    updatedAt
  } satisfies AuthUser;
}

export async function deleteManagedUser(input: {
  actorUserId: string;
  userId: string;
}) {
  await ensureBootstrapSuperAdmin();

  if (input.actorUserId === input.userId) {
    throw new Error("Không thể xóa chính tài khoản đang đăng nhập.");
  }

  const db = await getDatabase();
  const existing = await readUserRowById(db, input.userId);
  if (!existing) {
    throw new Error("Không tìm thấy user cần xóa.");
  }

  if (existing.role === "super_admin") {
    throw new Error("Không thể xóa tài khoản super admin.");
  }

  const deletedAt = nowIso();

  await withTransaction((tx) => {
    tx.run(
      `
        DELETE FROM sessions
        WHERE user_id = $userId
      `,
      { $userId: input.userId } as never
    );

    tx.run(
      `
        DELETE FROM users
        WHERE id = $userId
      `,
      { $userId: input.userId } as never
    );

    writeActivityLog(tx, {
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      eventType: "delete_user",
      targetType: "user",
      targetId: input.userId,
      payload: {
        username: existing.username,
        fullName: existing.full_name
      },
      createdAt: deletedAt
    });
  });

  return { ok: true as const };
}

export async function resetManagedUserPassword(input: {
  actorUserId: string;
  userId: string;
  temporaryPassword: string;
}) {
  await ensureBootstrapSuperAdmin();
  if (input.temporaryPassword.trim().length < 8) {
    throw new Error("Mật khẩu tạm phải có ít nhất 8 ký tự.");
  }

  const passwordHash = await hashPassword(input.temporaryPassword.trim());
  const updatedAt = nowIso();

  await withTransaction((db) => {
    const existing = dbFirst<UserRow>(db, `
      SELECT *
      FROM users
      WHERE id = $userId
    `, { $userId: input.userId });

    if (!existing) {
      throw new Error("Không tìm thấy user để reset mật khẩu.");
    }

    db.run(`
      UPDATE users
      SET password_hash = $passwordHash,
          must_change_password = 1,
          updated_at = $updatedAt
      WHERE id = $userId
    `, {
      $passwordHash: passwordHash,
      $updatedAt: updatedAt,
      $userId: input.userId
    } as never);

    revokeAllUserSessionsInDb(db, input.userId);

    writeActivityLog(db, {
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      eventType: "reset_password",
      targetType: "user",
      targetId: input.userId,
      payload: null,
      createdAt: updatedAt
    });
  });
}

export async function revokeManagedUserSessions(input: {
  actorUserId: string;
  userId: string;
}) {
  await ensureBootstrapSuperAdmin();
  const revokedAt = nowIso();

  await withTransaction((db) => {
    revokeAllUserSessionsInDb(db, input.userId);
    writeActivityLog(db, {
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      eventType: "revoke_sessions",
      targetType: "user",
      targetId: input.userId,
      payload: null,
      createdAt: revokedAt
    });
  });
}

export async function ensureAuthBootstrap() {
  await ensureBootstrapSuperAdmin();
}

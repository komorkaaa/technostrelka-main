import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import type { AdminUserItem } from "@/entities/admin/api";
import type { UserRole } from "@/entities/user/model";

type Props = {
  open: boolean;
  users: AdminUserItem[];
  initialUserId?: number | null;
  onClose: () => void;
  onSaveUser: (userId: number, payload: { nickname: string | null; age_group: "14-15" | "16-17" | null; role: UserRole }) => void;
};

export function UsersModerationModal(props: Props) {
  const { open, users, initialUserId, onClose, onSaveUser } = props;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [ageGroup, setAgeGroup] = useState<"14-15" | "16-17" | "">("");
  const [role, setRole] = useState<UserRole>("user");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  useEffect(() => {
    if (!open) return;
    if (initialUserId && users.some((user) => user.id === initialUserId)) {
      setSelectedUserId(initialUserId);
      return;
    }
    if (!selectedUser && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [initialUserId, open, selectedUser, users]);

  useEffect(() => {
    if (!selectedUser) return;
    setNickname(selectedUser.nickname ?? "");
    setAgeGroup((selectedUser.age_group ?? "") as "14-15" | "16-17" | "");
    setRole(selectedUser.role);
  }, [selectedUser]);

  if (!open) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard usersModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <div className="modalHeaderRow">
            <h1 style={{ fontSize: 20 }}>Все пользователи</h1>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
        <div className="modalBody">
          <div className="usersModalGrid" style={{ padding: 0 }}>
          <div className="usersModalList">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`usersModalListItem ${selectedUserId === user.id ? "active" : ""}`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{user.email}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  ID {user.id} {user.nickname ? `, ${user.nickname}` : ""}
                </div>
              </button>
            ))}
          </div>
          <div className="form">
            {selectedUser ? (
              <>
                <h2 style={{ margin: 0, fontSize: 18 }}>Доп. информация</h2>
                <div className="muted" style={{ fontSize: 13 }}>
                  {selectedUser.email}
                </div>
                <label className="label">
                  Никнейм
                  <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="необязательно" />
                </label>
                <label className="label">
                  Возрастная группа
                  <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as "14-15" | "16-17" | "")}>
                    <option value="">не указано</option>
                    <option value="14-15">14-15</option>
                    <option value="16-17">16-17</option>
                  </Select>
                </label>
                <label className="label">
                  Роль
                  <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                    <option value="user">user</option>
                    <option value="moderator">moderator</option>
                  </Select>
                </label>
                <Button
                  onClick={() =>
                    onSaveUser(selectedUser.id, {
                      nickname: nickname.trim() ? nickname.trim() : null,
                      age_group: ageGroup === "" ? null : ageGroup,
                      role,
                    })
                  }
                >
                  Сохранить пользователя
                </Button>
              </>
            ) : (
              <div className="hint">Пользователи не найдены.</div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

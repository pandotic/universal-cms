"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Badge,
  Select,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Users,
  Plus,
  MoreHorizontal,
  Shield,
  Trash2,
  UserCircle,
} from "lucide-react";

// TODO: Wire to GET /api/admin/users and POST/PUT/DELETE for mutations
// Sample data shape:
// const sampleUsers: AdminUser[] = [
//   { id: "1", email: "admin@example.com", display_name: "Admin User", roles: ["admin"], last_active: "2025-12-15T14:30:00Z", is_current: true },
//   { id: "2", email: "editor@example.com", display_name: "Jane Editor", roles: ["editor"], last_active: "2025-12-14T10:00:00Z", is_current: false },
// ];

type UserRole = "admin" | "editor" | "moderator";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  roles: UserRole[];
  last_active: string;
  is_current: boolean;
}

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  editor: "secondary",
  moderator: "outline",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  moderator: "Moderator",
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("editor");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((json) => { setUsers(json.data ?? []); })
      .catch(() => { /* silently handle - empty list is fine */ })
      .finally(() => setLoading(false));
  }, []);

  function handleAddUser() {
    if (!newUserEmail.trim()) return;
    // TODO: Call POST /api/admin/users
    const newUser: AdminUser = {
      id: crypto.randomUUID(),
      email: newUserEmail.trim(),
      display_name: newUserEmail.split("@")[0],
      roles: [newUserRole],
      last_active: new Date().toISOString(),
      is_current: false,
    };
    setUsers((prev) => [...prev, newUser]);
    setNewUserEmail("");
    setNewUserRole("editor");
    setAddDialogOpen(false);
  }

  function handleChangeRole(userId: string, role: UserRole) {
    fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
      .then((res) => {
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, roles: [role] } : u))
          );
        }
      })
      .catch(() => { /* silently handle */ });
  }

  function handleRemoveUser(userId: string) {
    fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
        }
      })
      .catch(() => { /* silently handle */ });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage admin users and their roles.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table / Empty State */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No users yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add team members to manage your site content.
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role(s)</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    user.is_current && "bg-primary/5"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {user.email}
                      </span>
                      {user.is_current && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.display_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={ROLE_VARIANT[role]}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(user.last_active)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "admin")}
                          disabled={user.roles.includes("admin")}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "editor")}
                          disabled={user.roles.includes("editor")}
                        >
                          <UserCircle className="mr-2 h-4 w-4" />
                          Set as Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(user.id, "moderator")
                          }
                          disabled={user.roles.includes("moderator")}
                        >
                          <UserCircle className="mr-2 h-4 w-4" />
                          Set as Moderator
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={user.is_current}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Invite a new team member to the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_user_email">Email Address</Label>
              <Input
                id="new_user_email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewUserEmail(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_user_role">Role</Label>
              <Select
                id="new_user_role"
                value={newUserRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewUserRole(e.target.value as UserRole)
                }
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={!newUserEmail.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Search, KeyRound, Trash2, Pencil, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/apiClient";
import { LoadingView, ErrorView, EmptyView } from "@/components/StateViews";
import { USERS } from "@/constants/testIds";

const roleVariant = { admin: "default", staff: "secondary", client: "outline" };

const fieldCls = "kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-[color:var(--kti-text-dim)]";

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [cForm, setCForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [cBusy, setCBusy] = useState(false);

  // edit dialog
  const [editUser, setEditUser] = useState(null);
  const [eBusy, setEBusy] = useState(false);
  // reset password dialog
  const [resetUser, setResetUser] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [rBusy, setRBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/admin/users?limit=100&search=${encodeURIComponent(search)}`);
      setUsers(res.data?.data || []);
    } catch (err) {
      setError(apiError(err, t("admin.loadError")));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => { load(); }, [load]);

  const submitCreate = async (e) => {
    e.preventDefault();
    setCBusy(true);
    try {
      await api.post("/admin/users", cForm);
      toast.success(t("admin.userCreated"));
      setCreateOpen(false);
      setCForm({ name: "", email: "", password: "", role: "client" });
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally { setCBusy(false); }
  };

  const submitEdit = async () => {
    if (!editUser) return;
    setEBusy(true);
    try {
      await api.patch(`/admin/users/${editUser.id}`, {
        name: editUser.name,
        role: editUser.role,
        status: editUser.status,
      });
      toast.success(t("admin.saved"));
      setEditUser(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally { setEBusy(false); }
  };

  const submitReset = async () => {
    if (!resetUser || newPass.length < 6) { toast.error("Min 6 char"); return; }
    setRBusy(true);
    try {
      await api.post(`/admin/users/${resetUser.id}/reset-password`, { password: newPass });
      toast.success(t("admin.passwordReset"));
      setResetUser(null); setNewPass("");
    } catch (err) {
      toast.error(apiError(err));
    } finally { setRBusy(false); }
  };

  const doDelete = async (u) => {
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success(t("admin.userDeleted"));
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t("admin.users")}</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <button data-testid={USERS.createButton} className="kti-focus inline-flex items-center gap-2 rounded-full border border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.2)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgba(124,104,225,0.3)]">
              <Plus className="size-4" /> {t("admin.createUser")}
            </button>
          </DialogTrigger>
          <DialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
            <DialogHeader><DialogTitle>{t("admin.createUser")}</DialogTitle></DialogHeader>
            <form onSubmit={submitCreate} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>{t("admin.name")}</label>
                <input required value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} className={fieldCls} data-testid={USERS.nameInput} />
              </div>
              <div>
                <label className={labelCls}>{t("admin.email")}</label>
                <input required type="email" value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })} className={fieldCls} data-testid={USERS.emailInput} />
              </div>
              <div>
                <label className={labelCls}>{t("admin.password")}</label>
                <input required type="text" minLength={6} value={cForm.password} onChange={(e) => setCForm({ ...cForm, password: e.target.value })} className={fieldCls} data-testid={USERS.passwordInput} />
              </div>
              <div>
                <label className={labelCls}>{t("admin.role")}</label>
                <Select value={cForm.role} onValueChange={(v) => setCForm({ ...cForm, role: v })}>
                  <SelectTrigger className="border-white/12 bg-white/[0.04]" data-testid={USERS.roleSelect}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                    <SelectItem value="staff">{t("admin.roleStaff")}</SelectItem>
                    <SelectItem value="client">{t("admin.roleClient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <button type="submit" disabled={cBusy} data-testid={USERS.submitButton} className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60">
                  {cBusy && <Loader2 className="size-4 animate-spin" />} {t("admin.save")}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.search")} data-testid={USERS.searchInput} className={`${fieldCls} pl-9`} />
      </div>

      <div className="overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/[0.04]">
        {loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={load} /> : users.length === 0 ? <EmptyView message={t("admin.noUsers")} /> : (
          <Table data-testid={USERS.table}>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-white/70">{t("admin.name")}</TableHead>
                <TableHead className="text-white/70">{t("admin.email")}</TableHead>
                <TableHead className="text-white/70">{t("admin.role")}</TableHead>
                <TableHead className="text-white/70">{t("admin.status")}</TableHead>
                <TableHead className="text-right text-white/70">{t("admin.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-white/8 hover:bg-white/[0.03]">
                  <TableCell className="font-medium text-white">{u.name}</TableCell>
                  <TableCell className="text-[color:var(--kti-text-dim)]">{u.email}</TableCell>
                  <TableCell><Badge variant={roleVariant[u.role] || "outline"}>{t(`admin.role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`)}</Badge></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-xs ${u.status === "active" ? "text-[#a9ecd2]" : "text-white/45"}`}>
                      <span className={`size-1.5 rounded-full ${u.status === "active" ? "bg-[#73D1AD]" : "bg-white/30"}`} />
                      {u.status === "active" ? t("admin.active") : t("admin.disabled")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditUser({ ...u })} data-testid={`${USERS.editButton}-${u.id}`} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white" aria-label="Edit"><Pencil className="size-3.5" /></button>
                      <button onClick={() => { setResetUser(u); setNewPass(""); }} data-testid={`${USERS.resetPasswordButton}-${u.id}`} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white" aria-label="Reset password"><KeyRound className="size-3.5" /></button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button data-testid={`${USERS.deleteButton}-${u.id}`} className="kti-focus grid size-8 place-items-center rounded-lg border border-white/10 text-[#ff96aa] hover:bg-[rgba(255,92,122,0.1)]" aria-label="Delete"><Trash2 className="size-3.5" /></button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("admin.confirmDeleteUser")}</AlertDialogTitle>
                            <AlertDialogDescription className="text-[color:var(--kti-text-dim)]">{u.name} · {u.email}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]">{t("admin.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => doDelete(u)} data-testid={USERS.confirmDeleteButton} className="border border-[rgba(255,92,122,0.4)] bg-[rgba(255,92,122,0.18)] text-white hover:bg-[rgba(255,92,122,0.28)]">{t("admin.delete")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
          <DialogHeader><DialogTitle>{t("admin.editUser")}</DialogTitle></DialogHeader>
          {editUser && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>{t("admin.name")}</label>
                <input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>{t("admin.role")}</label>
                <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger className="border-white/12 bg-white/[0.04]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                    <SelectItem value="staff">{t("admin.roleStaff")}</SelectItem>
                    <SelectItem value="client">{t("admin.roleClient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-white">{t("admin.active")}</span>
                <Switch checked={editUser.status === "active"} onCheckedChange={(v) => setEditUser({ ...editUser, status: v ? "active" : "disabled" })} data-testid={USERS.statusSwitch} />
              </div>
              <DialogFooter>
                <button onClick={submitEdit} disabled={eBusy} className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60">
                  {eBusy && <Loader2 className="size-4 animate-spin" />} {t("admin.save")}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className="border-white/10" style={{ background: "#0B0D17", color: "#E8EAF2" }}>
          <DialogHeader><DialogTitle>{t("admin.resetPassword")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[color:var(--kti-text-dim)]">{resetUser?.name} · {resetUser?.email}</p>
            <div>
              <label className={labelCls}>{t("admin.newPassword")}</label>
              <input type="text" minLength={6} value={newPass} onChange={(e) => setNewPass(e.target.value)} className={fieldCls} />
            </div>
            <DialogFooter>
              <button onClick={submitReset} disabled={rBusy} className="kti-focus inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60">
                {rBusy && <Loader2 className="size-4 animate-spin" />} {t("admin.save")}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useOrg } from '../lib/useOrg'
import {
  createOrg,
  joinOrg,
  fetchMembers,
  inviteMember,
  updateMember,
  removeMember,
} from '../lib/api'
import PageShell from '../components/layout/PageShell'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Building2, LogIn, Mail, Shield, Trash2, Users } from 'lucide-react'
import { cn } from '../lib/utils'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
]

const roleBadge = {
  admin: 'bg-accent/10 text-accent border-accent/30',
  hr: 'bg-mood-warm/10 text-mood-warm border-mood-warm/30',
  member: 'bg-elevated text-muted-foreground border-border-light',
}

function RoleBadge({ role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold capitalize',
        roleBadge[role] ?? roleBadge.member,
      )}
    >
      <Shield className="h-3 w-3" />
      {role ?? 'member'}
    </span>
  )
}

export default function People() {
  const { org, membership, loading, isStaff, isAdmin, reload } = useOrg()

  const [tab, setTab] = useState('create')
  const [orgName, setOrgName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!org?.id) return
    let cancelled = false
    setMembersLoading(true)
    setMembersError(null)
    fetchMembers(org.id)
      .then((rows) => !cancelled && setMembers(rows))
      .catch((err) => !cancelled && setMembersError(err.message || 'Could not load members.'))
      .finally(() => !cancelled && setMembersLoading(false))
    return () => {
      cancelled = true
    }
  }, [org?.id])

  async function refreshMembers() {
    if (!org?.id) return
    const rows = await fetchMembers(org.id).catch(() => null)
    if (rows) setMembers(rows)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!orgName.trim()) return
    setBusy(true)
    try {
      await createOrg(orgName.trim())
      toast.success('Organization created')
      reload()
    } catch (err) {
      toast.error(err.message || 'Could not create organization.')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setBusy(true)
    try {
      await joinOrg(joinCode.trim())
      toast.success('Joined organization')
      reload()
    } catch (err) {
      toast.error(err.message || 'Could not join organization.')
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !org?.id) return
    setInviting(true)
    try {
      await inviteMember(org.id, inviteEmail.trim(), inviteRole)
      toast.success(`Invite sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      await refreshMembers()
    } catch (err) {
      toast.error(err.message || 'Could not send invite.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRole(memberId, role) {
    if (!org?.id) return
    try {
      await updateMember(org.id, memberId, { system_role: role })
      toast.success('Role updated')
      setMembers((rows) =>
        rows.map((m) => (m.user_id === memberId ? { ...m, system_role: role } : m)),
      )
    } catch (err) {
      toast.error(err.message || 'Could not update role.')
    }
  }

  async function handleRemove(memberId) {
    if (!org?.id) return
    try {
      await removeMember(org.id, memberId)
      toast.success('Member removed')
      setMembers((rows) => rows.filter((m) => m.user_id !== memberId))
    } catch (err) {
      toast.error(err.message || 'Could not remove member.')
    }
  }

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading…
        </div>
      </PageShell>
    )
  }

  /* ── No org yet: onboarding (create / join) ───────────────────── */
  if (!org) {
    return (
      <PageShell className="px-6 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Users className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">Your team workspace</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              You're not part of an organization yet. Create one for your team, or join with an
              invite code.
            </p>
          </div>

          <div className="mb-6 flex rounded-xl border border-border bg-surface p-1">
            {[
              { key: 'create', label: 'Create', icon: Building2 },
              { key: 'join', label: 'Join', icon: LogIn },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  tab === key
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                className="mt-2"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Button type="submit" className="mt-4 w-full" disabled={busy || !orgName.trim()}>
                {busy ? 'Creating…' : 'Create organization'}
              </Button>
              <p className="mt-3 text-center text-xs text-dim">
                You'll become the admin and can invite your team.
              </p>
            </form>
          ) : (
            <form
              onSubmit={handleJoin}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <Label htmlFor="joinCode">Invite code</Label>
              <Input
                id="joinCode"
                className="mt-2 font-mono"
                placeholder="Organization ID"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button type="submit" className="mt-4 w-full" disabled={busy || !joinCode.trim()}>
                {busy ? 'Joining…' : 'Join organization'}
              </Button>
              <p className="mt-3 text-center text-xs text-dim">
                Ask your admin for the invite code.
              </p>
            </form>
          )}
        </div>
      </PageShell>
    )
  }

  /* ── Org present: roster + invites ────────────────────────────── */
  const yourUserId = membership?.user_id

  return (
    <PageShell className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            Organization
          </p>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{org.name}</h1>
              <p className="text-sm text-muted">
                {members.length} member{members.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>

        {isStaff && (
          <form
            onSubmit={handleInvite}
            className="mb-8 rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
              Invite a member
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                <Mail className="mr-2 h-4 w-4" />
                {inviting ? 'Sending…' : 'Invite'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-dim">
              The person must already have a Sentinel account (email + password).
            </p>
          </form>
        )}

        {membersError && (
          <div className="mb-6 rounded-xl border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {membersError}
          </div>
        )}

        {membersLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Loading members…
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const isYou = m.user_id === yourUserId
              const displayName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Member'
              return (
                <div
                  key={m.id ?? m.user_id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-elevated text-xs font-bold text-muted-foreground">
                      {(displayName.charAt(0) || '?').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {displayName}
                        {isYou && <span className="ml-2 text-xs font-medium text-dim">(you)</span>}
                      </p>
                      {m.email && <p className="truncate text-xs text-dim">{m.email}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.status === 'invited' && (
                      <span className="rounded-lg border border-mood-neutral/30 bg-mood-neutral/10 px-2 py-0.5 text-[11px] font-semibold text-mood-neutral">
                        Invited
                      </span>
                    )}
                    {isAdmin && m.user_id !== yourUserId ? (
                      <select
                        value={m.system_role}
                        onChange={(e) => handleRole(m.user_id, e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-primary focus:outline-none focus:border-accent transition-colors"
                        title="Change role"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={m.system_role} />
                    )}
                    {isAdmin && m.user_id !== yourUserId && (
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        aria-label={`Remove ${displayName}`}
                        title="Remove member"
                        className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-mood-cold"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}

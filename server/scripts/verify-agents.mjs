import 'dotenv/config'
import assert from 'node:assert/strict'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }) })
const password = '123456'
const suffix = Date.now()
const users = [`agent-test-a-${suffix}@example.com`, `agent-test-b-${suffix}@example.com`]

async function login(email) {
  const response = await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  assert.equal(response.status, 200, `login failed for ${email}`)
  return response.json()
}

async function api(path, token, init = {}) {
  const response = await fetch(`http://localhost:4000/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers } })
  return { status: response.status, body: await response.json().catch(() => null) }
}

const createdLeads = []
const createdStudents = []
const createdApplications = []
let agentIds = []
try {
  const admin = await login('admin@gmail.com')
  const adminHeaders = admin.accessToken
  const role = await prisma.role.findFirstOrThrow({ where: { name: 'Agent', tenantId: 1n } })
  const branch = await prisma.branch.findFirstOrThrow({ where: { tenantId: 1n } })
  const hash = await argon2.hash(password)
  for (const [index, email] of users.entries()) {
    const user = await prisma.user.create({ data: { tenantId: 1n, name: `Security Test Agent ${index}`, email, passwordHash: hash, roleId: role.id, branchId: branch.id } })
    const agent = await prisma.agent.create({ data: { tenantId: 1n, name: `Security Test Agent ${index}`, email, branchId: branch.id, userId: user.id } })
    agentIds.push(agent.id)
  }
  const sessions = await Promise.all(users.map(login))
  const leads = await Promise.all(sessions.map((session, index) => api('/students', session.accessToken, { method: 'POST', body: JSON.stringify({ name: `Security Test Referral ${index}`, email: `referral-${suffix}-${index}@example.com` }) })))
  leads.forEach((result) => { assert.equal(result.status, 201); assert.equal(result.body.type, 'Lead'); createdLeads.push(BigInt(result.body.id)) })

  for (const [index, session] of sessions.entries()) {
    const own = await api('/leads', session.accessToken)
    const other = await api(`/leads/${createdLeads[1 - index]}`, session.accessToken)
    assert.ok(own.body.data.some((row) => row.id === Number(createdLeads[index])), 'agent list lost its own lead')
    assert.equal(other.status, 403, 'agent could read another agent lead')
  }

  const autoAgent = agentIds[0]
  await api(`/agents/${autoAgent}`, adminHeaders, { method: 'PATCH', body: JSON.stringify({ autoConvertReferrals: true }) })
  const converted = await api('/students', sessions[0].accessToken, { method: 'POST', body: JSON.stringify({ name: `Security Test Student ${suffix}`, email: `student-${suffix}@example.com` }) })
  assert.equal(converted.status, 201)
  assert.ok(converted.body.studentNo, 'auto-convert did not return a student number')
  createdStudents.push(BigInt(converted.body.id))

  const combinations = [[false, false], [false, true], [true, false], [true, true]]
  for (const [agentEnabled, systemEnabled] of combinations) {
    await api(`/agents/${autoAgent}`, adminHeaders, { method: 'PATCH', body: JSON.stringify({ canSubmitApplications: agentEnabled }) })
    await api('/agents/settings/submission', adminHeaders, { method: 'PATCH', body: JSON.stringify({ enabled: systemEnabled }) })
    const result = await api('/applications', sessions[0].accessToken, { method: 'POST', body: JSON.stringify({ studentNo: converted.body.studentNo }) })
    const expected = agentEnabled && systemEnabled ? 201 : 403
    assert.equal(result.status, expected, `toggle matrix failed for agent=${agentEnabled}, system=${systemEnabled}`)
    if (result.status === 201 && result.body.id) createdApplications.push(BigInt(result.body.id))
  }
  console.log('Agent security integration checks passed: ownership + 4 toggle states')
} finally {
  await prisma.$transaction(async (tx) => {
    if (createdApplications.length) await tx.application.deleteMany({ where: { id: { in: createdApplications } } })
    if (createdStudents.length) {
      await tx.lead.updateMany({ where: { convertedStudentId: { in: createdStudents } }, data: { convertedStudentId: null } })
      await tx.student.deleteMany({ where: { id: { in: createdStudents } } })
    }
    await tx.lead.deleteMany({ where: { OR: [{ id: { in: createdLeads } }, { email: { startsWith: 'student-' } }, { email: { startsWith: 'referral-' } }] } })
    if (agentIds.length) await tx.agent.deleteMany({ where: { id: { in: agentIds } } })
    if (users.length) await tx.user.deleteMany({ where: { email: { in: users } } })
    await tx.appSetting.update({ where: { tenantId_key: { tenantId: 1n, key: 'agents.allowApplicationSubmission' } }, data: { value: true } })
  })
  await prisma.$disconnect()
}
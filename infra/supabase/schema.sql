-- =============================================================================
-- infra/supabase/schema.sql - Supabase PostgreSQL schema
-- Run this in Supabase SQL Editor, or let Prisma migrations create it.
-- =============================================================================

create extension if not exists "uuid-ossp";

create table if not exists public."School" (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  phone text not null,
  "logoUrl" text,
  "createdAt" timestamptz default now()
);

create table if not exists public."User" (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  name text not null,
  role text not null check (role in ('ADMIN','TEACHER','STUDENT','PARENT')),
  "schoolId" text not null,
  "isActive" boolean default true,
  "createdAt" timestamptz default now()
);

create table if not exists public."Teacher" (
  id uuid primary key default uuid_generate_v4(),
  "userId" text unique not null,
  "createdAt" timestamptz default now()
);

create table if not exists public."Parent" (
  id uuid primary key default uuid_generate_v4(),
  "userId" text unique not null,
  "createdAt" timestamptz default now()
);

create table if not exists public."Student" (
  id uuid primary key default uuid_generate_v4(),
  "userId" text unique,
  name text not null,
  "rollNumber" text not null,
  "dateOfBirth" timestamptz not null,
  "classId" text not null,
  "parentId" text,
  "createdAt" timestamptz default now()
);

create table if not exists public."Class" (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  section text not null,
  "schoolId" text not null,
  "createdAt" timestamptz default now()
);

create table if not exists public."Subject" (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

create table if not exists public."TeacherSubjectClass" (
  id uuid primary key default uuid_generate_v4(),
  "teacherId" text not null,
  "subjectId" text not null,
  "classId" text not null
);

create table if not exists public."Attendance" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" text not null,
  date timestamptz not null,
  status text not null check (status in ('PRESENT','ABSENT','LATE')),
  "markedBy" text not null,
  "createdAt" timestamptz default now(),
  unique ("studentId", date)
);

create table if not exists public."Homework" (
  id uuid primary key default uuid_generate_v4(),
  "classId" text not null,
  "subjectId" text not null,
  "teacherId" text not null,
  title text not null,
  description text not null,
  "attachmentUrl" text,
  "dueDate" timestamptz not null,
  "createdAt" timestamptz default now()
);

create table if not exists public."Notice" (
  id uuid primary key default uuid_generate_v4(),
  "schoolId" text not null,
  title text not null,
  content text not null,
  "targetRole" text,
  "targetClassId" text,
  "createdAt" timestamptz default now(),
  "sendSms" boolean default false
);

create table if not exists public."Exam" (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  "classId" text not null,
  "createdAt" timestamptz default now()
);

create table if not exists public."Mark" (
  id uuid primary key default uuid_generate_v4(),
  "examId" text not null,
  "studentId" text not null,
  "subjectId" text not null,
  score double precision not null,
  "fullMarks" double precision not null,
  grade text
);

create table if not exists public."Message" (
  id uuid primary key default uuid_generate_v4(),
  "senderId" text not null,
  "receiverId" text not null,
  content text not null,
  "createdAt" timestamptz default now(),
  "readAt" timestamptz
);

create table if not exists public."MessageTemplate" (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  locale text not null,
  title text,
  body text not null,
  "isActive" boolean default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_user_school on public."User"("schoolId");
create index if not exists idx_student_class on public."Student"("classId");
create index if not exists idx_attendance_student_date on public."Attendance"("studentId", date);
create index if not exists idx_notice_school on public."Notice"("schoolId");

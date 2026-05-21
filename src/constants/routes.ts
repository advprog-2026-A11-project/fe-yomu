export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  account: "/users/account",
  reading: {
    student: "/reading/student/readings",
    studentDetail: (id: string) => `/reading/student/readings/${id}`,
    studentQuiz: (id: string) => `/reading/student/readings/${id}/quiz`,
    admin: "/reading/admin",
    adminCreate: "/reading/admin/create-bacaan",
    adminEdit: (id: string) => `/reading/admin/create-bacaan?id=${id}`,
    adminDetail: (id: string) => `/reading/admin/reading/${id}`,
    adminQuiz: (id: string) => `/reading/admin/reading/${id}/quiz`,
  },
  forum: "/forums",
  achievement: "/achievement",
  clan: {
    list: "/clan",
    create: "/clan/create",
    detail: (id: string) => `/clan/detail/${id}`,
    edit: (id: string) => `/clan/edit/${id}`,
    addMember: (id: string) => `/clan/detail/${id}/add-member`,
    editMember: (clanId: string, index: string) => `/clan/detail/${clanId}/edit-member/${index}`,
  },
  auth: {
    callback: "/auth/callback",
    login: "/users?mode=login",
    register: "/users?mode=register",
  },
} as const;

export const NAV_LINKS = [
  { href: ROUTES.reading.student, label: "Reading" },
  { href: ROUTES.forum, label: "Forum" },
  { href: ROUTES.achievement, label: "Achievement" },
  { href: ROUTES.clan.list, label: "League" },
] as const;

const API_URL = import.meta.env.VITE_API_URL || "/api";
const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const throwIfNotOk = (response, data) => {
  if (response.ok) {
    return data;
  }

  const error = new Error(
    data?.message || data?.error || "Something went wrong. Please try again."
  );

  error.status = response.status;
  error.data = data;
  error.code = data?.code;

  throw error;
};

const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await parseJsonSafe(response);
  return throwIfNotOk(response, data);
};

const emptyOn404 = async (request, fallback) => {
  try {
    return await request();
  } catch (error) {
    if (error.status === 404) {
      return fallback;
    }
    throw error;
  }
};

export const registerUser = (userData) =>
  apiRequest("/auth/register/send-otp", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const verifyRegisterOTP = (email, otp) =>
  apiRequest("/auth/register/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      email,
      otp,
    }),
  });

export const loginUser = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

export const logoutUser = () =>
  apiRequest("/auth/logout", {
    method: "POST",
  });

export const getCurrentUser = () =>
  apiRequest("/auth/me", {
    method: "GET",
  });

export const sendForgotPasswordOTP = async (email) => {
  return apiRequest("/auth/forgot-password/send-otp", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  return apiRequest("/auth/forgot-password/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      email,
      otp,
    }),
  });
};

export const resetPassword = async (email, password, confirmPassword) => {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      confirmPassword,
    }),
  });
};

export const getStudentProfile = async () => {
  return apiRequest("/student/profile", {
    method: "GET",
  });
};

export const saveStudentProfile = async (formData) => {
  return apiRequest("/student/register", {
    method: "POST",
    body: formData,
  });
};

export const createStudentProfile = saveStudentProfile;

export const getDashboard = async () => {
  return apiRequest("/student/dashboard", {
    method: "GET",
  });
};

export const changePassword = async (payload) => {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

const asList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

export const getIndividualEvents = async () => {
  return asList(
    await apiRequest("/events/individual", {
      method: "GET",
    })
  );
};

export const getTeamEvents = async () => {
  return asList(
    await apiRequest("/events/team", {
      method: "GET",
    })
  );
};

export const checkPid = async (pid) => {
  return apiRequest("/events/check-pid", {
    method: "POST",
    body: JSON.stringify({ pid }),
  });
};

export const saveIndividualEvents = async (data) => {
  return apiRequest("/events/individual", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
};

export const saveTeam = async (payload) => {
  return apiRequest("/events/team", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getInvitations = async () => {
  return asList(
    await emptyOn404(
      () =>
        apiRequest("/events/invitations", {
          method: "GET",
        }),
      []
    )
  );
};

export const acceptInvitation = async (tid, pid) => {
  return apiRequest("/events/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ tid, pid }),
  });
};

export const rejectInvitation = async (tid, pid) => {
  return apiRequest("/events/invitations/reject", {
    method: "POST",
    body: JSON.stringify({ tid, pid }),
  });
};

export const deleteTeam = async (tid) => {
  return apiRequest("/events/team/delete", {
    method: "POST",
    body: JSON.stringify({ tid }),
  });
};

export const getIndividualParticipation = async () => {
  return emptyOn404(
    () =>
      apiRequest("/events/participation/individual", {
        method: "GET",
      }),
    { data: { events: [] }, pid: null }
  );
};

export const getTeamParticipation = async () => {
  return emptyOn404(
    () =>
      apiRequest("/events/participation/team", {
        method: "GET",
      }),
    { data: [] }
  );
};

export const getAdminOverview = () => apiRequest("/admin/overview");
export const getAdminStudents = (search = "") =>
  apiRequest(`/admin/students?search=${encodeURIComponent(search)}`);
export const verifyAdminStudent = (id, verified) =>
  apiRequest(`/admin/students/${id}/verify`, { method: "PATCH", body: JSON.stringify({ verified }) });
export const getAdminEvents = () => apiRequest("/admin/events");
export const createAdminEvent = (data) =>
  apiRequest("/admin/events", { method: "POST", body: JSON.stringify(data) });
export const updateAdminEvent = (id, data) =>
  apiRequest(`/admin/events/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAdminEvent = (id) =>
  apiRequest(`/admin/events/${id}`, { method: "DELETE" });
export const getAdminParticipation = (type = "All", event = "") =>
  apiRequest(`/admin/participation?type=${encodeURIComponent(type)}&event=${encodeURIComponent(event)}`);
export const getAdminStudentReport = (value) =>
  apiRequest(`/admin/students/report/${encodeURIComponent(value)}`);

export default apiRequest;

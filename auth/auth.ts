import api from "@/lib/api";
const apiurl = "http://localhost:3000/api"
export const postuser = async (data: { name?: string; bio?: string }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch("/api/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to update user");
  }

  return response.json();
};

export const postmode = async (data: { assistantmode: string }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${apiurl}/user/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    
    body: JSON.stringify(data),
  });
   
 console.log(data);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to update mode");
  }

  return response.json();
};

export const getuser = async (identifier: string) => {
  const response = await api.post("/user/get", { identifier });
  if (response.data && response.data.user) {
    return response.data.user;
  }
  return null;
};

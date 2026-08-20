// Get the logged-in user from localStorage
export const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user;
  } catch (err) {
    console.error("❌ Error parsing user from localStorage:", err);
    return null;
  }
};

// Save the logged-in user to localStorage
export const setCurrentUser = (user) => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      username: user.username,
      role: user.role,
    })
  );
};

// Clear the logged-in user on logout
export const clearCurrentUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

// Check if the current user is an Admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === "Admin";
};

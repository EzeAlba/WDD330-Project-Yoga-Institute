//module to protect pages by role

import { auth, db } from "./firebase.mjs";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Function to check if user is authenticated and has required role
export function requireRole(requiredRole, callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.hash = "#home";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    const role = snap.data().role;

    if (role !== requiredRole && requiredRole !== "any") {
      alert("Access denied");
      return;
    }

    callback(user, role);
  });
}

//Usage example:
// requireRole("admin", (user, role) => {
//   console.log("Access granted to", user.email, "with role", role);
// });

// import React, { useState } from "react";

// const Register = ({ setPage }) => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       alert("Passwords do not match");
//       return;
//     }

//     console.log("Registered:", formData);

//     // Go back to login
//     setPage('login');
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
//       <div className="bg-[#1e293b] p-8 rounded-2xl shadow-lg w-full max-w-md">

//         <h2 className="text-2xl font-bold text-white text-center mb-6">
//           Create Account
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">

//           <input
//             type="text"
//             name="firstName"
//             required
//             placeholder="First Name"
//             value={formData.firstName}
//             onChange={handleChange}
//             className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-gray-600"
//           />

//           <input
//             type="text"
//             name="lastName"
//             required
//             placeholder="Last Name"
//             value={formData.lastName}
//             onChange={handleChange}
//             className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-gray-600"
//           />

//           <input
//             type="email"
//             name="email"
//             required
//             placeholder="Email Address"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-gray-600"
//           />

//           <input
//             type="password"
//             name="password"
//             required
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-gray-600"
//           />

//           <input
//             type="password"
//             name="confirmPassword"
//             required
//             placeholder="Confirm Password"
//             value={formData.confirmPassword}
//             onChange={handleChange}
//             className="w-full p-2 rounded-lg bg-[#0f172a] text-white border border-gray-600"
//           />

//           <button
//             type="submit"
//             className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg"
//           >
//             Register
//           </button>
//         </form>

//         <p className="text-sm text-gray-400 mt-4 text-center">
//           Already have an account?{" "}
//           <span
//             onClick={() => setPage('login')}
//             className="text-cyan-400 cursor-pointer hover:underline"
//           >
//             Login here
//           </span>
//         </p>

//       </div>
//     </div>
//   );
// };

// export default Register;


import React, { useState } from "react";
import "../Login.css"; // ✅ use same CSS as login

const Register = ({ setPage }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.push(formData);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registered Successfully!");
    setPage("login");
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark-navy">
      <div className="login-card w-100" style={{ maxWidth: "450px" }}>
        
        <div className="text-center mb-4">
          <h2 className="text-white fw-bold">Create Account</h2>
          <p className="text-light-muted">Register to continue</p>
        </div>

        <div className="form-container p-4">
          <form onSubmit={handleSubmit}>
            
            <div className="mb-3">
              <input
                type="text"
                name="firstName"
                required
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-3">
              <input
                type="text"
                name="lastName"
                required
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                name="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-control custom-input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-cyan w-100 fw-bold py-2"
            >
              Register
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-light-muted small">
              Already have an account?{" "}
              <span
                onClick={() => setPage("login")}
                className="text-cyan text-decoration-none"
                style={{ cursor: "pointer" }}
              >
                Login here
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
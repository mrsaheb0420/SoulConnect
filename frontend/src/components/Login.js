import axios from "axios";
import { useState } from "react";

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });

  const login = async () => {
    const res = await axios.post("http://localhost:5000/api/auth/login", data);
    localStorage.setItem("token", res.data);
    alert("Login Successful");
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-bold mb-2">Login</h2>
      <input className="border p-2 w-full mb-2" placeholder="Email"
        onChange={e => setData({ ...data, email: e.target.value })} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password"
        onChange={e => setData({ ...data, password: e.target.value })} />
      <button onClick={login} className="bg-blue-500 text-white px-4 py-2 w-full">
        Login
      </button>
    </div>
  );
}

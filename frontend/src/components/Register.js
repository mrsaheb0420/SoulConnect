import axios from "axios";
import { useState } from "react";

export default function Register() {
  const [data, setData] = useState({ username: "", email: "", password: "" });

  const register = async () => {
    await axios.post("http://localhost:5000/api/auth/register", data);
    alert("Registered Successfully");
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-bold mb-2">Register</h2>
      <input className="border p-2 w-full mb-2" placeholder="Username"
        onChange={e => setData({ ...data, username: e.target.value })} />
      <input className="border p-2 w-full mb-2" placeholder="Email"
        onChange={e => setData({ ...data, email: e.target.value })} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password"
        onChange={e => setData({ ...data, password: e.target.value })} />
      <button onClick={register} className="bg-green-500 text-white px-4 py-2 w-full">
        Register
      </button>
    </div>
  );
}

import axios from "axios";
import { useEffect, useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const sender = "user1";
  const receiver = "user2";

  useEffect(() => {
    axios.get(`http://localhost:5000/api/chat/${sender}/${receiver}`)
      .then(res => setMessages(res.data));
  }, []);

  const send = async () => {
    const res = await axios.post("http://localhost:5000/api/chat/send", {
      sender, receiver, text
    });
    setMessages([...messages, res.data]);
    setText("");
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-bold mb-2">Chat</h2>

      <div className="h-40 overflow-y-auto border p-2 mb-2">
        {messages.map((m, i) => (
          <p key={i}><b>{m.sender}:</b> {m.text}</p>
        ))}
      </div>

      <input className="border p-2 w-full mb-2" value={text}
        onChange={e => setText(e.target.value)} />
      <button onClick={send}
        className="bg-blue-500 text-white px-4 py-2 w-full">
        Send
      </button>
    </div>
  );
}

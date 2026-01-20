import axios from "axios";
import { useEffect, useState } from "react";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/posts")
      .then(res => setPosts(res.data));
  }, []);

  const addPost = async () => {
    await axios.post("http://localhost:5000/api/posts", {
      user: "user1",
      text
    });
    window.location.reload();
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-bold mb-2">Feed</h2>

      <input className="border p-2 w-full mb-2" placeholder="What's on your mind?"
        onChange={e => setText(e.target.value)} />
      <button onClick={addPost}
        className="bg-blue-600 text-white px-4 py-2 w-full mb-3">
        Post
      </button>

      {posts.map(p => (
        <div key={p._id} className="border p-2 mb-2 rounded">
          <p>{p.text}</p>
          <small>❤️ {p.likes}</small>
        </div>
      ))}
    </div>
  );
}

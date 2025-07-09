import React, { useEffect, useState } from "react"
import { db, collection, query, orderBy, limit, getDocs } from "./firebase/firebase.js";
import { addDoc, collection } from "firebase/firestore";


export default function ScoreBoard() {
  const [scores, setScores] = useState([])

  useEffect(() => {
    const fetchScores = async () => {
      const q = query(collection(db, "scores"), orderBy("time", "asc"), limit(10))
      const querySnapshot = await getDocs(q)
      const topScores = querySnapshot.docs.map(doc => doc.data())
      setScores(topScores)
    }

    fetchScores()
  }, [])

  return (
    <div style={{ color: "white", marginTop: 20 }}>
      <h3>🏆 Top 10 Scores</h3>
      <ol>
        {scores.map((s, i) => (
          <li key={i}>
            {s.name} - {s.time.toFixed(2)} 秒
          </li>
        ))}
      </ol>
    </div>
  )
}

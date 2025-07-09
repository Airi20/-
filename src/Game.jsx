import React, { useEffect, useState, useRef } from 'react';
import ScoreBoard from "./ScoreBoard";

import { db, addDoc, collection, query, orderBy, limit, getDocs } from "./firebase/firebase.js";



const canvasWidth = 400
const canvasHeight = 600
const playerWidth = 40
const playerHeight = 40
const enemyWidth = 40
const enemyHeight = 40
const bulletSize = 8
const maxLives = 3
const enemyY = 50
const moveSpeed = 10

const createEnemy = (id, x) => ({
  id,
  x,
  y: enemyY,
  alive: true,
  cooldown: id * 400,
})

const createBullet = (x, y, dy, fromPlayer) => ({
  x,
  y,
  dy,
  fromPlayer,
})

export default function Game() {
  const [status, setStatus] = useState("start")
  const [playerX, setPlayerX] = useState(canvasWidth / 2 - playerWidth / 2)
  const [playerLives, setPlayerLives] = useState(maxLives)
  const [enemies, setEnemies] = useState([])
  const [playerBullets, setPlayerBullets] = useState([])
  const [enemyBullets, setEnemyBullets] = useState([])
  const [clearTime, setClearTime] = useState(null)
  const [playerName, setPlayerName] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showRanking, setShowRanking] = useState(false);


  const playerXRef = useRef(playerX)
  const enemiesRef = useRef(enemies)
  const playerBulletsRef = useRef(playerBullets)
  const enemyBulletsRef = useRef(enemyBullets)
  const startTimeRef = useRef(null)

  const handleNext = () => {
    setShowRanking(true);
  };

  useEffect(() => { playerXRef.current = playerX }, [playerX])
  useEffect(() => { enemiesRef.current = enemies }, [enemies])
  useEffect(() => { playerBulletsRef.current = playerBullets }, [playerBullets])
  useEffect(() => { enemyBulletsRef.current = enemyBullets }, [enemyBullets])

  const keys = useRef({})
  useEffect(() => {
    const handleDown = (e) => { keys.current[e.key] = true }
    const handleUp = (e) => { keys.current[e.key] = false }
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [])

  const canShootRef = useRef(true)
  const shootPlayerBullet = () => {
    if (!canShootRef.current) return
    canShootRef.current = false
    setTimeout(() => { canShootRef.current = true }, 300)
    setPlayerBullets((prev) => [
      ...prev,
      createBullet(
        playerXRef.current + playerWidth / 2 - bulletSize / 2,
        canvasHeight - playerHeight - 30,
        -8,
        true
      ),
    ])
  }

  const resetGame = () => {
    setPlayerX(canvasWidth / 2 - playerWidth / 2)
    setPlayerLives(maxLives)
    setEnemies([
      createEnemy(1, 30),
      createEnemy(2, 110),
      createEnemy(3, 190),
      createEnemy(4, 270),
      createEnemy(5, 350),
    ])
    setPlayerBullets([])
    setEnemyBullets([])
    setPlayerName("")
    setSubmitted(false)
    setClearTime(null)
    setShowRanking(false);
    startTimeRef.current = Date.now()
    setStatus("playing")
  }

  useEffect(() => {
    if (status === "clear") {
      const time = (Date.now() - startTimeRef.current) / 1000
      setClearTime(time)
    }
  }, [status])

  const handleSubmitScore = async () => {
    if (!playerName) return alert("名前を入力してね！")
    try {
      await addDoc(collection(db, "scores"), {
        name: playerName,
        time: clearTime,
        createdAt: new Date(),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (status !== "playing") return
    const interval = setInterval(() => {
      if (keys.current['ArrowLeft']) {
        setPlayerX((x) => Math.max(0, x - moveSpeed))
      }
      if (keys.current['ArrowRight']) {
        setPlayerX((x) => Math.min(canvasWidth - playerWidth, x + moveSpeed))
      }
      if (keys.current[' ']) {
        shootPlayerBullet()
        keys.current[' '] = false
      }

      setEnemies((prev) =>
        prev.map((enemy) => {
          if (!enemy.alive) return enemy
          const moveDir = Math.floor(Math.random() * 3) - 1
          const newX = Math.min(canvasWidth - enemyWidth, Math.max(0, enemy.x + moveDir * 5))
          const newCooldown = enemy.cooldown - 100

          if (newCooldown <= 0) {
            setEnemyBullets((bullets) => [
              ...bullets,
              createBullet(newX + enemyWidth / 2 - bulletSize / 2, enemy.y + enemyHeight, 6, false),
            ])
            return { ...enemy, x: newX, cooldown: 2000 }
          }
          return { ...enemy, x: newX, cooldown: newCooldown }
        })
      )

      setPlayerBullets((bullets) =>
        bullets.map((b) => ({ ...b, y: b.y + b.dy })).filter((b) => b.y > -bulletSize)
      )
      setEnemyBullets((bullets) =>
        bullets.map((b) => ({ ...b, y: b.y + b.dy })).filter((b) => b.y < canvasHeight + bulletSize)
      )

      enemyBulletsRef.current.forEach((b) => {
        if (
          b.x < playerXRef.current + playerWidth &&
          b.x + bulletSize > playerXRef.current &&
          b.y > canvasHeight - playerHeight - 20 &&
          b.y < canvasHeight
        ) {
          setPlayerLives((lives) => {
            const nextLives = lives - 1
            if (nextLives <= 0) setStatus("gameover")
            return nextLives
          })
          setEnemyBullets((bullets) => bullets.filter((e) => e !== b))
        }
      })

      playerBulletsRef.current.forEach((b) => {
        enemiesRef.current.forEach((enemy) => {
          if (!enemy.alive) return
          if (
            b.x < enemy.x + enemyWidth &&
            b.x + bulletSize > enemy.x &&
            b.y < enemy.y + enemyHeight &&
            b.y + bulletSize > enemy.y
          ) {
            setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e)))
            setPlayerBullets((bullets) => bullets.filter((e) => e !== b))
          }
        })
      })

      if (enemiesRef.current.every((e) => !e.alive)) {
        setStatus("clear")
      }
    }, 100)
    return () => clearInterval(interval)
  }, [status])

  const overlayStyle = {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    background: 'rgba(0,0,0,0.7)',
    padding: '20px 30px',
    borderRadius: 10,
    textAlign: 'center',
    zIndex: 20,
  }

  const buttonStyle = {
    marginTop: 20,
    padding: '10px 20px',
    fontSize: 18,
    backgroundColor: 'dodgerblue',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  }

  return (
    <div style={{
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#222',
      border: '2px solid #555',
      position: 'relative',
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      {/* プレイヤー */}
      {status === "playing" && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: playerX,
          width: playerWidth,
          height: playerHeight,
          backgroundImage: 'url(/player/player.jpg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }} />
      )}

      {/* 敵 */}
      {enemies.map((e) =>
        e.alive ? (
          <div key={e.id} style={{
            position: 'absolute',
            top: e.y,
            left: e.x,
            width: enemyWidth,
            height: enemyHeight,
            backgroundColor: 'crimson',
            borderRadius: 5,
          }} />
        ) : null
      )}

      {/* 弾 */}
      {playerBullets.map((b, i) => (
        <div key={'p' + i} style={{
          position: 'absolute',
          top: b.y,
          left: b.x,
          width: bulletSize,
          height: bulletSize,
          backgroundColor: 'lime',
          borderRadius: '50%',
        }} />
      ))}
      {enemyBullets.map((b, i) => (
        <div key={'e' + i} style={{
          position: 'absolute',
          top: b.y,
          left: b.x,
          width: bulletSize,
          height: bulletSize,
          backgroundColor: 'red',
          borderRadius: '50%',
        }} />
      ))}

      {/* ライフ表示 */}
      {status === "playing" && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
        }}>
          Lives: {playerLives}
        </div>
      )}

      {/* オーバーレイ（開始・勝利・敗北） */}
      {status === "start" && (
        <div style={overlayStyle}>
          <div>💫 Press Start!</div>
          <button style={buttonStyle} onClick={resetGame}>Start Game</button>
        </div>
      )}
      {status === "gameover" && (
        <div style={overlayStyle}>
          <div>💥 Game Over</div>
          <button style={buttonStyle} onClick={resetGame}>Retry</button>
        </div>
      )}
      {status === "clear" && (
        <div style={overlayStyle}>
          <div>🎉 You Win!</div>
          <div style={{ fontSize: 16, marginTop: 4 }}>
            タイム: {clearTime?.toFixed(2)} 秒
          </div>

          {!submitted && !showRanking && (
            <>
              <input
                type="text"
                placeholder="名前を入力"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{ marginTop: 10, padding: 5, fontSize: 14 }}
              />
              <br />
              <button style={buttonStyle} onClick={handleSubmitScore}>
                スコア送信
              </button>
            </>
          )}

          {submitted && !showRanking && (
            <>
              <div style={{ marginTop: 10, fontSize: 14 }}>おめでとう！🥰</div>
              <button
                style={{ ...buttonStyle, marginTop: 10 }}
                onClick={handleNext}
              >
                次へ
              </button>
            </>
          )}

          {showRanking && (
            <>
              <div style={{ maxHeight: 300, overflowY: "auto", fontSize: 12 }}>
                <ScoreBoard />
              </div>
              <button
                style={{ ...buttonStyle, marginTop: 10 }}
                onClick={resetGame}
              >
                もう一回やる！
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
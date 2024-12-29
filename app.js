import React, { useState, useEffect } from 'react';

const Game = () => {
  const [player, setPlayer] = useState({
    x: 50,
    y: 250,
    velocityY: 0,
    velocityX: 0,
    onGround: true,
    coins: 0,
    health: 100,
    armor: 1,
    speed: 5,
    jumpPower: 15
  });

  const [game, setGame] = useState({
    score: 0,
    level: 1,
    gameOver: false,
    showUpgrades: false
  });

  const [entities, setEntities] = useState({
    platforms: [
      { id: 'ground', x: 0, y: 280, width: 400, height: 20 },
      { id: 'p1', x: 100, y: 200, width: 100, height: 20 },
      { id: 'p2', x: 250, y: 150, width: 100, height: 20 }
    ],
    coins: [],
    spikes: [],
    powerUps: []
  });

  // إنشاء عملة جديدة
  const createCoin = () => ({
    id: Math.random(),
    x: Math.random() * 350 + 25,
    y: Math.random() * 200 + 50,
    collected: false
  });

  // إنشاء شوك جديد
  const createSpike = () => ({
    id: Math.random(),
    x: Math.random() * 350 + 25,
    y: 260,
    width: 20,
    height: 20
  });

  // شراء الترقيات
  const buyUpgrade = (type) => {
    if (player.coins >= 10) {
      setPlayer(prev => ({
        ...prev,
        coins: prev.coins - 10,
        [type]: prev[type] + (type === 'armor' ? 0.2 : type === 'speed' ? 1 : 2)
      }));
    }
  };

  // حلقة اللعبة الرئيسية
  useEffect(() => {
    if (game.gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayer(prev => {
        // تحديث موقع اللاعب
        let newY = prev.y + prev.velocityY;
        let newVelocityY = prev.velocityY + 0.8; // الجاذبية
        let onGround = false;

        // التصادم مع المنصات
        entities.platforms.forEach(platform => {
          if (newY + 40 > platform.y && 
              prev.y + 40 <= platform.y && 
              prev.x + 20 > platform.x && 
              prev.x - 20 < platform.x + platform.width) {
            newY = platform.y - 40;
            newVelocityY = 0;
            onGround = true;
          }
        });

        // تحديث موقع X مع الحركة السلسة
        let newX = prev.x + prev.velocityX;
        newX = Math.max(20, Math.min(380, newX));

        return {
          ...prev,
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          onGround,
          velocityX: prev.velocityX * 0.9 // الاحتكاك
        };
      });

      // تحديث العملات
      setEntities(prev => {
        const newCoins = prev.coins.filter(coin => !coin.collected);
        if (newCoins.length < 5 && Math.random() < 0.02) {
          newCoins.push(createCoin());
        }
        
        const newSpikes = prev.spikes;
        if (newSpikes.length < 3 && Math.random() < 0.01) {
          newSpikes.push(createSpike());
        }

        return { ...prev, coins: newCoins, spikes: newSpikes };
      });

      // فحص التصادمات
      checkCollisions();
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [game.gameOver, entities.platforms]);

  // التحكم باللاعب
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (game.gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          setPlayer(prev => ({
            ...prev,
            velocityX: -prev.speed
          }));
          break;
        case 'ArrowRight':
          setPlayer(prev => ({
            ...prev,
            velocityX: prev.speed
          }));
          break;
        case 'ArrowUp':
          setPlayer(prev => {
            if (prev.onGround) {
              return {
                ...prev,
                velocityY: -prev.jumpPower,
                onGround: false
              };
            }
            return prev;
          });
          break;
        case 'u':
          setGame(prev => ({
            ...prev,
            showUpgrades: !prev.showUpgrades
          }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.gameOver]);

  // فحص التصادمات
  const checkCollisions = () => {
    // جمع العملات
    entities.coins.forEach(coin => {
      const dx = Math.abs(player.x - coin.x);
      const dy = Math.abs(player.y - coin.y);
      if (dx < 30 && dy < 30 && !coin.collected) {
        setEntities(prev => ({
          ...prev,
          coins: prev.coins.map(c => 
            c.id === coin.id ? { ...c, collected: true } : c
          )
        }));
        setPlayer(prev => ({
          ...prev,
          coins: prev.coins + 1
        }));
        setGame(prev => ({
          ...prev,
          score: prev.score + 10
        }));
      }
    });

    // التصادم مع الأشواك
    entities.spikes.forEach(spike => {
      const dx = Math.abs(player.x - (spike.x + spike.width/2));
      const dy = Math.abs(player.y - (spike.y + spike.height/2));
      if (dx < 25 && dy < 25) {
        const damage = 10 / player.armor;
        setPlayer(prev => {
          const newHealth = prev.health - damage;
          if (newHealth <= 0) {
            setGame(prev => ({ ...prev, gameOver: true }));
          }
          return { ...prev, health: Math.max(0, newHealth) };
        });
      }
    });
  };

  return (
    <div className="relative w-full max-w-md h-96 bg-gray-800 overflow-hidden rounded-lg">
      {/* لوحة المعلومات */}
      <div className="absolute top-4 left-4 text-white space-y-2">
        <div>النقاط: {game.score}</div>
        <div>العملات: {player.coins}</div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-700 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${player.health}%` }}
            />
          </div>
          <span>الصحة</span>
        </div>
      </div>

      {/* اللاعب */}
      <div 
        className="absolute w-10 h-10 bg-blue-500 rounded-lg"
        style={{ 
          left: player.x - 20,
          top: player.y - 20
        }}
      />

      {/* المنصات */}
      {entities.platforms.map(platform => (
        <div
          key={platform.id}
          className="absolute bg-gray-600"
          style={{
            left: platform.x,
            top: platform.y,
            width: platform.width,
            height: platform.height
          }}
        />
      ))}

      {/* العملات */}
      {entities.coins.map(coin => !coin.collected && (
        <div
          key={coin.id}
          className="absolute w-6 h-6 bg-yellow-400 rounded-full animate-pulse"
          style={{
            left: coin.x - 12,
            top: coin.y - 12
          }}
        />
      ))}

      {/* الأشواك */}
      {entities.spikes.map(spike => (
        <div
          key={spike.id}
          className="absolute bg-red-500"
          style={{
            left: spike.x,
            top: spike.y,
            width: spike.width,
            height: spike.height,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)'
          }}
        />
      ))}

      {/* قائمة الترقيات */}
      {game.showUpgrades && (
        <div className="absolute right-4 top-4 bg-gray-900 p-4 rounded-lg">
          <h3 className="text-white mb-2">الترقيات (10 عملات):</h3>
          <button
            className="block w-full mb-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => buyUpgrade('armor')}
          >
            تحسين الدرع ({player.armor.toFixed(1)})
          </button>
          <button
            className="block w-full mb-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => buyUpgrade('speed')}
          >
            تحسين السرعة ({player.speed})
          </button>
          <button
            className="block w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => buyUpgrade('jumpPower')}
          >
            تحسين القفز ({player.jumpPower})
          </button>
        </div>
      )}

      {/* شاشة انتهاء اللعبة */}
      {game.gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl mb-4">انتهت اللعبة!</h2>
            <p className="text-xl">النقاط: {game.score}</p>
            <p className="text-lg">العملات: {player.coins}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
              onClick={() => {
                setGame({
                  score: 0,
                  level: 1,
                  gameOver: false,
                  showUpgrades: false
                });
                setPlayer({
                  x: 50,
                  y: 250,
                  velocityY: 0,
                  velocityX: 0,
                  onGround: true,
                  coins: 0,
                  health: 100,
                  armor: 1,
                  speed: 5,
                  jumpPower: 15
                });
                setEntities({
                  platforms: [
                    { id: 'ground', x: 0, y: 280, width: 400, height: 20 },
                    { id: 'p1', x: 100, y: 200, width: 100, height: 20 },
                    { id: 'p2', x: 250, y: 150, width: 100, height: 20 }
                  ],
                  coins: [],
                  spikes: [],
                  powerUps: []
                });
              }}
            >
              العب مرة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
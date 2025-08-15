// /Users/user/Desktop/Projects/connect-four-game/src/App.tsx
import React, { useEffect, useState } from "react"; // Import useEffect and useState
import { Routes, Route, useLocation } from "react-router-dom";
import MainMenu from "./pages/MainMenu";
import Rules from "./pages/Rules";
import Game from "./pages/Game";
import { AnimatePresence } from "framer-motion";
import Modal from "./components/UI/modal/Modal";
import MenuWrapper from "./components/UI/menuWrapper/MenuWrapper";
import GameMenuContext from "./components/game/gameMenuContext/GameMenuContext";
import { useAppSelector } from "./store/hooks";
import { selectIsModalOpened } from "./store/modalSlice";
import { selectGameIsRunning } from "./store/gameSlice";
import DifficaltyGameModalContent from "./components/UI/difficultyModalContent/DifficultyGameModalContent";

// --- Farcaster SDK Import ---
import { sdk } from "@farcaster/frame-sdk"; // Import SDK and relevant types

function App() {
  const location = useLocation();
  const isOpenModal = useAppSelector(selectIsModalOpened);
  const gameIsRunning = useAppSelector(selectGameIsRunning);

  // --- Farcaster State ---
  const [farcasterUser, setFarcasterUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Basic state for demo

  // --- Farcaster SDK Integration ---
  useEffect(() => {
    // 1. Call sdk.actions.ready() once the main UI is loaded
    // This tells the Farcaster client (e.g., Warpcast) to hide the splash screen.
    sdk.actions
      .ready()
      .then(() => console.log("Farcaster SDK ready signal sent."))
      .catch((error) =>
        console.error("Error sending SDK ready signal:", error)
      );
    sdk.context.then((context) => {
      console.log("Farcaster Context:", context);
      if (context?.user) {
        setFarcasterUser(context.user);
      }
    });
  }, []);

  // 3. Use sdk.actions.signIn() for Farcaster authentication

  const handleSignIn = async () => {
    try {
      const nonce = Math.random().toString(36).substring(2);
      console.log("Requesting Sign In with Nonce:", nonce);

      const siwfResult = await sdk.actions.signIn({ nonce });
      console.log("SIWF Result:", siwfResult); // Contains message + signature

      // --- Demo Only: Assume success after getting signature ---
      setIsAuthenticated(true);
      alert(
        `Sign In successful (Backend verification required!)\nFID from context: ${farcasterUser?.fid}\nMessage: ${siwfResult.message}`
      );
      // --- End Demo Only ---
    } catch (error) {
      console.error("Farcaster Sign In failed:", error);
      setIsAuthenticated(false);
      // Handle errors (e.g., user rejected, invalid nonce - though nonce validation is backend)
      alert("Sign in failed or was rejected.");
    }
  };

  // 4. Use sdk.actions.composeCast() to allow users to share results
  const handleShareResult = async () => {
    try {
      // Customize the text and embeds based on game state (win/loss, score, etc.)
      const castText = `I just played Connect Four within Farcaster! Want to play?`;

      const appUrl = "https://connect-4-gamma-lake.vercel.app";

      const castResult = await sdk.actions.composeCast({
        text: castText,
        embeds: [appUrl], // Max 2 embeds allowed
      });

      if (castResult) {
        // User successfully posted the cast
        console.log("User posted cast:", castResult);
        alert(`Successfully shared cast! Hash: ${castResult.cast.hash}`);
      } else {
        // User cancelled the composer
        console.log("User cancelled cast composition.");
      }
    } catch (error) {
      console.error("Failed to compose cast:", error);
      alert("Could not open cast composer.");
    }
  };

  return (
    <div className="app">
      {/* --- Example Farcaster UI Elements (for demonstration) --- */}
      {farcasterUser && (
        <div
          style={{
            position: "fixed", // Use fixed to keep it visible
            top: 10,
            left: 10,
            zIndex: 10000, // High z-index
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {farcasterUser.pfpUrl && (
            <img
              src={farcasterUser.pfpUrl}
              alt="pfp"
              width="20"
              height="20"
              style={{ marginRight: "8px", borderRadius: "50%" }}
            />
          )}
          <span>
            Playing as:{" "}
            {farcasterUser.displayName ||
              farcasterUser.username ||
              `FID: ${farcasterUser.fid}`}
          </span>
          {!isAuthenticated && (
            <button
              onClick={handleSignIn}
              style={{
                marginLeft: "10px",
                fontSize: "10px",
                padding: "2px 5px",
              }}
            >
              Verify Identity
            </button>
          )}
          {/* Place the share button where appropriate, e.g., after game ends */}
          <button
            onClick={handleShareResult}
            style={{ marginLeft: "10px", fontSize: "10px", padding: "2px 5px" }}
          >
            Share Game
          </button>
        </div>
      )}
      {/* --- End Example Farcaster UI Elements --- */}

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/rules" element={<Rules />} />
          <Route
            path="/game"
            element={gameIsRunning ? <Game /> : <MainMenu />}
          />
          <Route path="*" element={gameIsRunning ? <Game /> : <MainMenu />} />
        </Routes>
      </AnimatePresence>
      <AnimatePresence>
        {isOpenModal.gameMenu && (
          <Modal key="gameMenuModal">
            <MenuWrapper type="gameMenu">
              <GameMenuContext />
            </MenuWrapper>
          </Modal>
        )}
        {isOpenModal.mainMenu && (
          <Modal key="mainMenuModal">
            <DifficaltyGameModalContent />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

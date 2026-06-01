import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable RFID Scanner Component
 * Listens for keyboard-emulated input from USB RFID scanners.
 *
 * @param {Function} onScan - Callback triggered when a full scan is received. Receives the UID as argument.
 * @param {boolean} active - Whether the scanner is currently listening for input.
 * @param {string} placeholder - Placeholder text for the hidden input (useful for debugging).
 */
const RFIDScanner = ({ onScan, active = true, placeholder = "Scan RFID Card..." }) => {
  const [rfidInput, setRfidInput] = useState('');
  const inputRef = useRef(null);
  const focusTimerRef = useRef(null);
  // Timestamp of when scanner became active — used to ignore auto-refire from USB reader
  const activeSinceRef = useRef(0);
  // How long (ms) to ignore all input after becoming active
  const IGNORE_WINDOW_MS = 600;

  useEffect(() => {
    if (active) {
      setRfidInput('');                        // clear any stale value
      activeSinceRef.current = Date.now();     // record activation time

      // Delay focus so USB reader's auto-refire window passes before we listen
      focusTimerRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, IGNORE_WINDOW_MS);
    }
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [active]);

  const handleBlur = () => {
    if (active) {
      focusTimerRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // ── Guard: ignore any scan that arrives within IGNORE_WINDOW_MS of activation
      // This prevents USB RFID readers from auto-re-firing the previously scanned card
      if (Date.now() - activeSinceRef.current < IGNORE_WINDOW_MS) {
        setRfidInput(''); // discard the auto-fired value
        return;
      }

      const val = rfidInput.trim();
      if (val) {
        onScan(val);
        setRfidInput(''); // clear for next scan
      }
    }
  };

  const handleChange = (e) => {
    setRfidInput(e.target.value);
  };

  if (!active) return null;

  return (
    <div style={{ opacity: 0, position: 'absolute', top: '-9999px' }}>
      <input
        type="text"
        ref={inputRef}
        value={rfidInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-hidden="true"
        autoComplete="off"
      />
    </div>
  );
};

export default RFIDScanner;

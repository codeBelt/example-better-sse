'use client';

import {useEffect, useRef, useState} from 'react';

type TriggerEventBody = {
  message: string;
  timestamp: string;
};

const baseUrl = 'http://localhost:8080';

export const Dashboard = () => {
  const [count, setCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [customEvents, setCustomEvents] = useState<TriggerEventBody[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const eventsContainerRef = useRef(null);

  // Animation effect when new events arrive
  useEffect(() => {
    if (customEvents.length > 0) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 1500);
    }
  }, [customEvents.length]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${baseUrl}/sse`);

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setConnectionStatus('connected');
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('error');
        eventSource?.close();
        setTimeout(connectSSE, 5000);
      };

      eventSource.addEventListener('tick', (event) => {
        const newCount = parseInt(event.data, 10);

        setCount(newCount);
      });

      eventSource.addEventListener('session-count', (event) => {
        const newSessionCount = parseInt(event.data, 10);

        setSessionCount(newSessionCount);
      });

      eventSource.addEventListener('custom-event', (event) => {
        const eventData: TriggerEventBody = JSON.parse(event.data);

        console.log('Custom event received:', eventData);

        setCustomEvents((prevEvents) => [eventData, ...prevEvents.slice(0, 9)]);
      });
    };

    connectSSE();

    return () => {
      console.log('Component unmounting, closing SSE connection');

      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleTriggerEvent = async () => {
    if (!message.trim() && messageInputRef.current) {
      messageInputRef.current.focus();

      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${baseUrl}/trigger-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || 'Event triggered!',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Failed to trigger event:', data.error);
      }
    } catch (error) {
      console.error('Error sending trigger request:', error);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
          Real-time Events Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? 'Live' : connectionStatus}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-opacity-60 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-gray-400">Counter</p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-blue-400">{count}</h2>
            <div className="text-blue-400">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-opacity-60 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-gray-400">Active Connections</p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-purple-400">{sessionCount}</h2>
            <div className="text-purple-400">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Event Trigger Section */}
      <div className="bg-opacity-50 mb-6 rounded-lg border border-gray-700 bg-gray-800 p-5 shadow-lg backdrop-blur-sm">
        <h2 className="mb-4 flex items-center text-xl font-semibold">
          <svg
            className="mr-2 h-5 w-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 10V3L4 14h7v7l9-11h-7z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          Trigger Custom Event
        </h2>
        <div className="flex gap-2">
          <input
            ref={messageInputRef}
            className="bg-opacity-70 flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Type your message here..."
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTriggerEvent()}
          />
          <button
            className={`flex items-center rounded-lg px-4 py-2 font-medium transition-all ${
              isLoading || connectionStatus !== 'connected'
                ? 'cursor-not-allowed bg-gray-600 opacity-60'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:from-blue-600 hover:to-purple-700'
            }`}
            disabled={isLoading || connectionStatus !== 'connected'}
            onClick={handleTriggerEvent}
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Send Event
              </>
            )}
          </button>
        </div>
      </div>

      {/* Events Feed */}
      <div className="relative">
        {showNotification && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform animate-bounce rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
            New event received!
          </div>
        )}

        <div className="bg-opacity-50 rounded-lg border border-gray-700 bg-gray-800 p-5 shadow-lg backdrop-blur-sm">
          <h2 className="mb-4 flex items-center text-xl font-semibold">
            <svg
              className="mr-2 h-5 w-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Event Feed
          </h2>
          <div ref={eventsContainerRef} className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-1">
            {customEvents.length > 0 ? (
              customEvents.map((event, index) => (
                <div
                  key={index}
                  className={`bg-opacity-60 rounded-lg border border-gray-600 bg-gray-700 p-4 ${index === 0 ? 'animate-pulse-once' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium break-words">{event.message}</p>
                    <span className="ml-2 text-xs whitespace-nowrap text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <svg
                  className="mx-auto mb-2 h-10 w-10 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <p className="text-gray-400">No events received yet</p>
                <p className="mt-1 text-sm text-gray-500">Send an event to see it appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>SSE Connection Status: {connectionStatus}</p>
      </div>
    </div>
  );
};

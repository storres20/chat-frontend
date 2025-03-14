'use client';

import { useState, useEffect, useRef } from 'react';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState(null);
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isWsConnected, setIsWsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        //const socket = new WebSocket('ws://145.223.120.127:3001'); // Replace with your VPS IP
        //const socket = new WebSocket('ws://192.168.1.49:3001'); // Replace with your localhost IP
        //const socket = new WebSocket('wss://chat.lonkansoft.pro:3001'); // Secure WebSocket connection with WSS
        //const socket = new WebSocket('wss://chat.website101.xyz:3001'); // Secure WebSocket connection with WSS
        const socket = new WebSocket('wss://chat-backend-production-79af.up.railway.app'); // railway backend with SSL

        setWs(socket);

        socket.onopen = () => {
            setIsWsConnected(true);
            console.log('WebSocket connection established.');
        };

        socket.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);
            //console.log("WebSocket received:", parsedData); // Debugging log

            if (parsedData.type === 'message' || parsedData.type === 'chat_message') {
                setMessages((prevMessages) => [...prevMessages, parsedData]); // No `.data` field
            } else if (parsedData.type === 'users') {
                setConnectedUsers(parsedData.data);
            } else if (parsedData.type === 'history') {
                setMessages(parsedData.data);
            }
        };

        socket.onclose = () => {
            setIsWsConnected(false);
            console.log('WebSocket connection closed.');
        };

        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSetUsername = () => {
        if (username.trim() && isWsConnected) {
            setIsUsernameSet(true);
            ws.send(JSON.stringify({ type: 'set_username', username }));
        } else {
            console.log('WebSocket is not ready to send messages.');
        }
    };

    const sendMessage = () => {
        if (ws && input && isWsConnected) {
            const messageData = { type: 'chat_message', username, message: input };
            ws.send(JSON.stringify(messageData));
            setInput('');
        } else {
            console.log('WebSocket is not ready or message is empty.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const formatDate = (isoString) => {
        //console.log("Timestamp received on frontend:", isoString); // Log timestamp to troubleshoot

        const date = new Date(isoString);
        if (isNaN(date)) {
            return 'Invalid Date'; // Handle invalid timestamp
        }
        return date.toLocaleString(); // Format it as a local string
    };

    return (
        <div className="flex max-w-4xl mx-auto p-6 space-x-4">
            {isUsernameSet && (
                <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Connected Users</h2>
                    <ul className="space-y-2">
                        {connectedUsers.map((user, index) => (
                            <li key={index} className="text-lg text-green-600">
                                {user.username} (online)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="w-3/4">
                {!isUsernameSet ? (
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-semibold">Enter your username</h2>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                        />
                        <button
                            onClick={handleSetUsername}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            disabled={!isWsConnected}
                        >
                            Set Username
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold text-center">Real-time Chat</h1>
                        <h3>Welcome {username}</h3>
                        <div className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-lg shadow">
                            {messages.map((msg, index) => {
                                const { username, message, timestamp } = msg;

                                let messageStyle = { color: 'black' };
                                let usernameStyle = { color: 'blue' };

                                if (username === 'System' && message.includes('joined')) {
                                    usernameStyle = { color: 'green', fontWeight: 'bold' };
                                    messageStyle = { color: 'green', fontWeight: 'bold' };
                                } else if (username === 'System' && message.includes('left')) {
                                    usernameStyle = { color: 'red', fontWeight: 'bold' };
                                    messageStyle = { color: 'red', fontWeight: 'bold' };
                                }

                                // Format the timestamp and handle any potential errors
                                const formattedTimestamp = formatDate(timestamp);

                                return (
                                    <p key={index} className="mb-2">
                                        <span className="text-gray-500 text-sm mr-2">[{formattedTimestamp}]</span>
                                        <strong style={usernameStyle}>{username}:</strong>{' '}
                                        <span style={messageStyle}>{message}</span>
                                    </p>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message"
                                className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                            />
                            <button
                                onClick={sendMessage}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                disabled={!isWsConnected}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;

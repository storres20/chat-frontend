'use client';

import { useState, useEffect } from 'react';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState(null);
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);

    useEffect(() => {
        const socket = new WebSocket('ws://145.223.120.127:3001'); // Replace with your VPS IP
        setWs(socket);

        socket.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);

            if (parsedData.type === 'message') {
                setMessages((prevMessages) => [...prevMessages, parsedData.data]);
            } else if (parsedData.type === 'users') {
                setConnectedUsers(parsedData.data);
            }
        };

        return () => {
            socket.close();
        };
    }, []);

    const handleSetUsername = () => {
        if (username.trim()) {
            setIsUsernameSet(true);
            const newUserMessage = JSON.stringify({ username: 'System', message: `${username} has joined the chat.` });
            ws.send(newUserMessage);
            ws.username = username; // Set username for the WebSocket connection
        }
    };

    const sendMessage = () => {
        if (ws && input) {
            const messageData = { username, message: input };
            ws.send(JSON.stringify(messageData));
            setInput('');
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
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
                    >
                        Set Username
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <h1 className="text-3xl font-semibold text-center">Real-time Chat</h1>
                    <div className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-lg shadow">
                        {messages.map((msg, index) => {
                            const { username, message } = msg;
                            return (
                                <p key={index} className="mb-2">
                                    <strong className="text-blue-600">{username}:</strong> {message}
                                </p>
                            );
                        })}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message"
                            className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                        />
                        <button
                            onClick={sendMessage}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            Send
                        </button>
                    </div>
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold">Connected Users</h2>
                        <ul className="list-disc pl-5">
                            {connectedUsers.map((user, index) => (
                                <li key={index} className="text-gray-700">{user}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;

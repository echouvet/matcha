
socket.on('setUserId', function (userId) {
    user[userId] = socket;
    socket.myid = userId;
})
socket.on('seen', function (user_id) {
    con.query('UPDATE notifs SET seen=1 WHERE user_id=?', [user_id])
})
socket.on('room', function (user_id, his_id) {
    if (user_id > his_id)
        room = user_id + his_id;
    else
        room = his_id + user_id;
    socket.join(room);
});
socket.on('nouveau_client', function(pseudo, user_id, his_id) {
    socket.pseudo = pseudo;
    socket.user_id = user_id;
    socket.his_id = his_id;
    io.to(room).emit('nouveau_client', pseudo);
});

function notifmsg(user_id, his_id, name) {
    con.query('SELECT * FROM block WHERE user_id = ? AND his_id = ?', [his_id, user_id], function (err, block) { if (err) throw err 
        if (block.length == 0)
        {
            var msg = name +' HAS SENT YOU A NEW MESSAGE'
            con.query('INSERT INTO notifs (user_id, his_id, notif) VALUES (?, ?, ?) ', [his_id, user_id, msg], function (err) { if (err) throw err })
            if (user[his_id])
            {
                con.query('SELECT date FROM notifs WHERE user_id=? AND his_id=? AND notif=?', [his_id, user_id, msg], function (err, date) { if (err) throw err 
                user[his_id].emit('notification', {his_id: user_id, not: msg, date:date[0].date}); })
            }
        }
    })
}

socket.on('message', function (message, room) {
    message = eschtml(message);
    con.query("INSERT INTO `chat` (message, user_id, his_id) VALUES (?,?,?)", [message, socket.user_id, socket.his_id], function (err) { 
        if (err) throw err;
        notifmsg(socket.user_id, socket.his_id, socket.pseudo)
        io.to(room).emit('message', {pseudo: socket.pseudo, message: message}); 
    });
});


socket.on('disconnect', function(){
       con.query('UPDATE users SET active=CURRENT_TIMESTAMP WHERE id=?', [socket.myid], function (err) { if (err) throw err })
       delete user[socket.myid];
});
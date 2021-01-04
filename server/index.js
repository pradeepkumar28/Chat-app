const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

const  { addUser, removeUser, getUser, getUserInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router.js');

const app =express();
const server = http.createServer(app);
const io = socketio(server,{
    cors: {
      origin: 'https://chat-n-chat.netlify.app',
      credentials: true
    }
});

app.use(cors());
app.use(router);
// app.get('/products/:id', function (req, res, next) {
//     res.json({msg: 'This is CORS-enabled for all origins!'})
//     next();
//   })
  
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "https://chat-n-chat.netlify.app/"); // update to match the domain you will make the request from
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
 // });
  


io.on('connect', (socket)=>{
   

     socket.on('join',({name,room},callback)=>{
     const {error , user } = addUser({ id: socket.id, name, room })
      
     if (error) {
         return callback(error);
     }
     socket.join(user.room);

     socket.emit('message', {user : 'admin' ,text:`${user.name}, welcome to the ${user.room}`})
     socket.broadcast.to(user.room).emit('message', { user : 'admin' ,text:`${user.name},just joined the ${user.room}`});

     io.to(user.room).emit('roomData', { room : user.room , users : getUserInRoom(user.room )})

     callback();

     });

     socket.on('sendMessage',(message, callback ) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message',{ user: user.name , text : message});

        callback();
     });

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', {user : 'Admin', text : `${user.name} has left.`});
            io.to(user.room).emit('roomData',{room : user.room , users : getUserInRoom(user.room)});
        }
    })
});


server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
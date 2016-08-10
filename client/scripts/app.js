var Message = function(username, message, roomname) {
  this.username = username;
  this.text = message;
  this.roomname = roomname;
};

var LikeButton = function() {
  this.likeCount = 0;
  this.button = $('<button class="btn btn-success btn-sm">' + this.likeCount + '</button>');
};
LikeButton.prototype.like = function() {
  this.likeCount ++;
  this.button.text(this.likeCount + ' <3');
};
LikeButton.prototype.addClick = function() {
  this.button.on('click', function() {
    this.like();
  }.bind(this));
};

var ReButton = function() {
  this.button = $('<button class="btn btn-info btn-sm" width="50px">Retweet</button>');
};
ReButton.prototype.retweet = function() {
  var retweet = {username: window.location.search.substring(10) + ' @' + this.button.parent().parent().children('.username').text(), 
    text: window.location.search.substring(10) + ' retweeted: ' + this.button.parent().parent().children('.text').text(),
    roomname: $('#roomSelect').val()};
  app.send(app.addMessage(retweet));
};
ReButton.prototype.addClick = function() {
  this.button.on('click', function() {
    this.retweet();
  }.bind(this));
};

var app = {};
var friendsOnly = false;
app.server = 'https://api.parse.com/1/classes/messages';
app.messageStorage = {};
app.queueMessage = [];
app.friendList = {};
app.rooms = { 'Main Room': true};

app.init = function() {
  app.fetch();
  var $li = $('<li class="presentation"></li>');
  var $a = $('<a></a>');
  $a.text('All');
  $li.append($a);
  $('.nav').append($li);
  $a.on('click', function() {
    $('#roomSelect').val($a.text()).trigger('change');
  });
  var $friendLi = $('<li></li>');
  var $friendA = $('<a></a>');
  $friendA.text("Friends' Feed");
  $friendLi.append($friendA);
  $('.nav').append($friendLi);
  $friendA.on('click', function() {
    if (friendsOnly === false) {
      $friendA.addClass('list-group-item active');
    } else {
      $friendA.removeClass('list-group-item active');
    }
    friendsOnly = !friendsOnly;
    app.clearMessages();
    app.fetch();
  });
};
app.send = function(message) {
  $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: 'https://api.parse.com/1/classes/messages',
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      this.messageStorage[data.objectId] = message;
    }.bind(this),
    error: function (data) {
    // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message', data);
    }
  });
};

app.fetch = function() {
  var stuff = $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: 'https://api.parse.com/1/classes/messages',
    type: 'GET',
    contentType: 'application/json',
    success: function (data) {
      data.results.forEach(function(ParseObj) {
        if (!app.messageStorage.hasOwnProperty(ParseObj.objectId)) {
          var newMessage = new Message(ParseObj.username, ParseObj.text, ParseObj.roomname);
          app.messageStorage[ParseObj.objectId] = newMessage;
          app.queueMessage.push(newMessage);
          if (!app.rooms.hasOwnProperty(String(ParseObj.roomname).replace(/ /g, ''))) {
            app.rooms[String(ParseObj.roomname).replace(/ /g, '')] = false;
            // app.addRoom(ParseObj.roomname.replace(/ /g, ''));
            var writableRoom = String(ParseObj.roomname);
            app.addRoom(writableRoom.replace(/ /g, ''));
          }
        }
      });
      while (app.queueMessage.length > 0) {
        if (!friendsOnly) {
          app.addMessage(app.queueMessage.pop());
        } else {
          var nextMsg = app.queueMessage.pop();
          if (app.friendList[nextMsg.username] === true) {
            app.addMessage(nextMsg);
          }
        }
      }

    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to get message', data);
    }
  });
};

app.clearMessages = function() {
  app.messageStorage = {};
  app.queueMessage.length = 0;
  $('#chats').empty();
};



app.addMessage = function(message) {
  //The different components of the message
  //The whole body of the message
  var msg = $('<div class="message"></div>');
  //The username component
  var username = $('<span class="username"></span>');
  //The actual message component
  var userMessage = $('<span class="text"></span>');
  //Adds the roomname
  msg.addClass(message.roomname ? message.roomname.replace(/ /g, '') : 'All');
  username.text(message.username);
  username.addClass(message.username);
  //Checks to see whether we already had this friend.
  if (app.friendList.hasOwnProperty(String(message.username))) {
    username.addClass('friend');
  }
  userMessage.text(message.text);
  username.on('click', function(msg) {
    var userClassStr = '.' + String(message.username);
    app.addFriend(username.text());
    $(userClassStr).addClass('friend');
  });
  msg.append(username).append(userMessage);

  var buttons = $('<div class="btn-group"></div>');
  //Various Buttons we are adding to our message including a like button and a retweet button
  var likeMessage = new LikeButton();
  likeMessage.addClick();
  buttons.append(likeMessage.button);

  var retwt = new ReButton();
  retwt.addClick();
  buttons.append(retwt.button);

  msg.append(buttons);
  $('#chats').prepend(msg);
  if (!app.canAdd(message.roomname)) {
    msg.hide();
  }
  return message;
};



app.addRoom = function(roomname) {
  var room = $('<option></option>');
  room.val(roomname);
  room.text(roomname);
  $('#roomSelect').append(room);
};

//Simple helper function to add friend to list of friends.
app.addFriend = function(friendName) {
  app.friendList[friendName] = true;
};

app.handleSubmit = function() {
  //Function which was required to pass Mocha, just a placeholder
};

//Checks to see whether or not we can add a message based on the current room.
app.canAdd = function(messageRoom) {
  if ($('#roomSelect').val() === 'All') {
    return true;
  } else if ($('#roomSelect').val() === String(messageRoom).replace(/ /g, '')) {
    if (messageRoom === undefined) { return false; }
    return true;
  }
  return false;
};

$(document).ready(function() {
  //If you hit enter while focused on the input field, you'll add a message
  $('#input').keydown(function(e) {
    if (e.keyCode === 13 && this.val()) {
      var message = new Message(window.location.search.substring(10), this.val(), $('#roomSelect').val());
      app.send(app.addMessage(message));
      this.val('');
    }
  }.bind($('#input')));

  //If you hit enter after making a room, you'll create a room
  $('#room-maker').keydown(function(e) {
    if (e.keyCode === 13 && this.val()) {
      app.addRoom(this.val());
      this.val('');
    }
  }.bind($('#room-maker')));

  //Placeholder because we never implemented the button...
  $('#send').on('submit', function() {
    app.handleSubmit();
  });

  //When we change rooms we have to handle a lot of different things.
  $('#roomSelect').on('change', function(e) {
    if ($(roomSelect).val() === 'All') {
      $('#chats').children().show();
    } else {
      var roomname = $(roomSelect).val().replace(/ /g, '');
      if (app.rooms[roomname] === false) {
        var $li = $('<li class="presentation"></li>');
        var $a = $('<a></a>');
        $a.text($('#roomSelect').val());
        $li.append($a);
        $('.nav').append($li);
        $a.on('click', function() {
          $('#roomSelect').val($a.text()).trigger('change');
        });
        $a.on('dblclick', function() {
          $li.remove();
          $('#roomSelect').val('All').trigger('change');
          app.rooms[roomname] = false;
        });
        app.rooms[roomname] = true;
      }
      $('#chats').children().hide();
      $('.' + roomname).show();
    }
  });


  app.init();
  setInterval(function() {
    app.fetch();
  }, 2000);

});




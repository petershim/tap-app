angular.module('tapApp.controllers', [])
  .controller('SignUpCtrl', [
    '$scope', '$rootScope', '$firebaseAuth', '$window',
    function ($scope, $rootScope, $firebaseAuth, $window) {
      $scope.user = {
        email: "",
        password: ""
      };
      $scope.createUser = function () {
        var email = this.user.email;
        var password = this.user.password;

        if (!email || !password) {
          $rootScope.notify("Please enter valid credentials");
          return false;
        }

        $rootScope.show('Please wait.. Registering');
        $rootScope.auth.$createUser(email, password, function (error, user) {
          if (!error) {
            $rootScope.hide();
            $rootScope.userEmail = user.email;
            $window.location.href = ('#/map/list');
          }
          else {
            $rootScope.hide();
            if (error.code == 'INVALID_EMAIL') {
              $rootScope.notify('Invalid Email Address');
            }
            else if (error.code == 'EMAIL_TAKEN') {
              $rootScope.notify('Email Address already taken');
            }
            else {
              $rootScope.notify('Oops something went wrong. Please try again later');
            }
          }
        });
      }
    }
  ])
  .controller('SignInCtrl', [
  '$scope', '$rootScope', '$firebaseAuth', '$window',
  function ($scope, $rootScope, $firebaseAuth, $window) {
     // check session
     $rootScope.checkSession();
     $scope.user = {
        email: "",
        password: ""
     };
     $scope.validateUser = function () {
        $rootScope.show('Please wait.. Authenticating');
        var email = this.user.email;
        var password = this.user.password;
        if (!email || !password) {
           $rootScope.notify("Please enter valid credentials");
           return false;
        }
        $rootScope.auth.$login('password', {
           email: email,
           password: password
        })
        .then(function (user) {
          $rootScope.hide();
          $rootScope.userEmail = user.email;
          $window.location.href = ('#/map/list');
        }, function (error) {
          $rootScope.hide();
          if (error.code == 'INVALID_EMAIL') {
            $rootScope.notify('Invalid Email Address');
          }
          else if (error.code == 'INVALID_PASSWORD') {
            $rootScope.notify('Invalid Password');
          }
          else if (error.code == 'INVALID_USER') {
            $rootScope.notify('Invalid User');
          }
          else {
            $rootScope.notify('Oops something went wrong. Please try again later');
          }
        });
     }
  }
])
.controller('myListCtrl', function($rootScope, $scope, $window, $ionicModal, $firebase) {
  $rootScope.show("Please wait... Processing");
  $scope.list = [];
  var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
  bucketListRef.on('value', function(snapshot) {
    var data = snapshot.val();

    $scope.list = [];

    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key].isCompleted == false) {
          data[key].key = key;
          $scope.list.push(data[key]);
        }
      }
    }

    if ($scope.list.length == 0) {
      $scope.noData = true;
    } else {
      $scope.noData = false;
    }
    $rootScope.hide();
  });

  $ionicModal.fromTemplateUrl('templates/newItem.html', function(modal) {
    $scope.newTemplate = modal;
  });

  $scope.newTask = function() {
    $scope.newTemplate.show();
  };

  $scope.markCompleted = function(key) {
    $rootScope.show("Please wait... Updating List");
    var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail) + '/' + key);
    itemRef.update({
      isCompleted: true
    }, function(error) {
      if (error) {
        $rootScope.hide();
        $rootScope.notify('Oops! something went wrong. Try again later');
      } else {
        $rootScope.hide();
        $rootScope.notify('Successfully updated');
      }
    });
  };

  $scope.deleteItem = function(key) {
    $rootScope.show("Please wait... Deleting from List");
    var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
    bucketListRef.child(key).remove(function(error) {
      if (error) {
        $rootScope.hide();
        $rootScope.notify('Oops! something went wrong. Try again later');
      } else {
        $rootScope.hide();
        $rootScope.notify('Successfully deleted');
      }
    });
  };
})
.controller('newCtrl', function($rootScope, $scope, $window, $firebase) {
  $scope.data = {
    item: ""
  };

  $scope.close = function() {
    $scope.modal.hide();
  };

  $scope.createNew = function() {
    var item = this.data.item;

    if (!item) return;

    $scope.modal.hide();
    $rootScope.show();
    $rootScope.show("Please wait... Creating new");

    var form = {
      item: item,
      isCompleted: false,
      created: Date.now(),
      updated: Date.now()
    };

    var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
    $firebase(bucketListRef).$add(form);
    $rootScope.hide();
  };
})
.controller('completedCtrl', function($rootScope, $scope, $window, $firebase) {
  $rootScope.show("Please wait... Processing");
  $scope.list = [];

  var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
  bucketListRef.on('value', function(snapshot) {
    $scope.list = [];
    var data = snapshot.val();

    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key].isCompleted == true) {
          data[key].key = key;
          $scope.list.push(data[key]);
        }
      }
    }
    if ($scope.list.length == 0) {
      $scope.noData = true;
    } else {
      $scope.noData = false;
    }

    $rootScope.hide();
  });

  $scope.deleteItem = function(key) {
    $rootScope.show("Please wait... Deleting from List");
    var itemRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
    bucketListRef.child(key).remove(function(error) {
      if (error) {
        $rootScope.hide();
        $rootScope.notify('Oops! something went wrong. Try again later');
      } else {
        $rootScope.hide();
        $rootScope.notify('Successfully deleted');
      }
    });
  };
})
.controller('MapCtrl', function($scope, $rootScope, $firebase, $ionicModal){
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.0130987, lng: -118.495067},
    zoom: 8
  });
  console.log('map initialized');
  //DB stuff
  var bucketListRef = new Firebase($rootScope.baseUrl + escapeEmailAddress($rootScope.userEmail));
  bucketListRef.on('value', function(snapshot) {
    var data = snapshot.val();

    $scope.list = [];
    console.log($scope.list);
    //Data stuff for lists
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key].isCompleted == false) {
          data[key].key = key;
          $scope.list.push(data[key]);
        }
      }
    }

    if ($scope.list.length == 0) {
      $scope.noData = true;
    } else {
      $scope.noData = false;
    }
    $rootScope.hide();
  });
  //Modal New Item
  $ionicModal.fromTemplateUrl('templates/newItem.html', function(modal) {
    $scope.newTemplate = modal;
  });

  $scope.newTask = function() {
    $scope.newTemplate.show();
  };
  //--------------



  var infoWindow = new google.maps.InfoWindow({map: map});

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map.setCenter(pos);

      var marker1 = new google.maps.Marker({
        position: pos,
        map: map
      });
      marker1.addListener('click', function(){
        var infoWindow1 = new google.maps.InfoWindow({
          map: map,
          content: 'This is you!<br>Your Network is: WifiForEveryone<br>Connections Today: 2<br>Daily Total: $2.00<br>Network Strength: 111.13 mbps'
        });
        infoWindow1.open(map, marker1);

      });

    })
  }

  map.addListener('click', function(evt){
    placeMarkerAndPanTo(evt.latLng, map);

  });

  function placeMarkerAndPanTo(latLng, map){
    var marker = new google.maps.Marker({
      position: latLng,
      map: map
    });
    map.panTo(latLng);

    marker.addListener('click', function(){
      infoWindow.open(map, marker);
      this.setPosition(this.getPosition());
    });

    var infoWindow = new google.maps.InfoWindow({
      map: map,
      content: '<input type="text" id="network">Add network</input><br><input type="text" id="password">Add Password</input><br><button>save</button>'
    });

    google.maps.event.addListener(infoWindow, 'domready', function() {
      $('button').on('click', function(evt){
        var parent = $(evt.target).parent();
        var networkName = $(parent).find('#network').val();
        console.log(networkName);
        var passwordName = $(parent).find('#password').val();
        console.log(passwordName);
        form = {
          item: [networkName, passwordName],
          isCompleted: false,
          created: Date.now(),
          updated: Date.now()
        };
        $firebase(bucketListRef).$add(form);
        $rootScope.hide();
      });
    });

  }

  // function windowContent(){
  //   infoWindow.setContent('<div id="network" contentEditable="true">Add network..</div><br><div id="password" contentEditable="true">Add password..</div><br><button onclick="saveLocation()">Submit</button>')
  // }

});

function escapeEmailAddress(email) {
  if (!email) return false
  // Replace '.' (not allowed in a Firebase key) with ','
  email = email.toLowerCase();
  email = email.replace(/\./g, ',');
  return email.trim();
}

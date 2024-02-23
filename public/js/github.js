var lastUpdate = new Date();
var myUser = "";

let myPrs = [];

$(document).ready(function(){


  $.ajax({
    url: 'user',
    success: function(json) {
        if (json.error) console.error("Unable to get user ", json.error);
        else myUser = json.response.name;
    }
  })

  $("#search-button").click(function(){
    //Disabled updated notifications
    lastUpdate = new Date();  
    search();
    report(); 
    review(); 
  });

  setInterval(search, 60*5*1000); // reload every 5 minutes
})

function changeFavicon(favicon) {
  const refreshFav = `${favicon}?v=${(new Date).getTime()}`
  $("#favicon").attr('href', refreshFav)
}

function notify(msg) {
  var title = "Github PR notification"; 
  var options = {
    body: msg,
    icon: "favicon.png"
  };
  var timeout = 5000;

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  
  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(title, options);
    setTimeout(function(){ notification.close() }, timeout);

  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(title, options);
        setTimeout(function(){ notification.close() }, timeout);

      }
    });
  }

  // At last, if the user has denied notifications, and you 
  // want to be respectful there is no need to bother them any more.
}

function search(){
    var token = $("#token").val();
    var search = $("#search").val();

    if (!token) alert("Search requires a private token to work");
    if (!search) alert("Search can't be empty, eg: is:open");
    if (!token || !search) return;

    var url = "issues-search?token="+token+"&search="+search;
    var nUpdated = 0;

    $.ajax({
      url: url,
      success: function(json){
        if (json.error) {
          console.error("Unable to get issues ", json.error);
          return
        }
        myPrs = [];
          var otherPrs = [];

          var getGroup = function(issues, groupName){
            for (var i = 0; i <issues.length; i++){
              if (issues[i][0].title === groupName) return i;
            }
            return -1;
          }
          var addIssue = function(issues, group, issue){
            var groupId = getGroup(issues, group);
            if (groupId < 0) issues.push([issue]);
            else issues[groupId].push(issue);
          }

          github= json;

          for (var i=0 ; i < json.items.length; i++){
            var issue = json.items[i];
            var group = issue.title;

            var rep_url = issue.repository_url.split("/");
            var repository = rep_url[rep_url.length -1];
            issue.repository = repository;
            //Replace repository_url from api.github to github.com
            issue.repository_url = issue.repository_url.replace('api.', '').replace('repos/', '');

            issue.updated = new Date(issue.updated_at) > lastUpdate;
            if (issue.updated) nUpdated++;

            if (issue.user.login === myUser) {
              addIssue(myPrs, group, issue);
            } else {
              addIssue(otherPrs, group, issue);
            }
          }

          var template = $('#file-template').html();
          Mustache.parse(template);
          var myPrsRendered = Mustache.render(template, myPrs);
          var otherPrsRendered = Mustache.render(template, otherPrs);

          $("#my-prs").html("<b>My PRS</b>").append(myPrsRendered);
          $("#other-prs").html("<b>Other PRs</b>").append(otherPrsRendered);
          if (nUpdated > 0 ) {
            notify(nUpdated + " issues updated");
            changeFavicon('favicon-red.png')

          } else {
            changeFavicon('favicon-green.png')
          }
      }
    })
  }
  

  function review(){
    var token = $("#token").val();
    var search = $("#search").val();

    if (!token) alert("Search requires a private token to work");
    if (!search) alert("Search can't be empty, eg: is:open");
    if (!token || !search) return;

    var url = "issues-search?token="+token+"&search="+search + " review-requested:@me";
    var nUpdated = 0;

    $.ajax({
      url: url,
      success: function(json){
        if (json.error) {
          console.error("Unable to get issues ", json.error);
          return
        }
          var otherPrs = [];

          var getGroup = function(issues, groupName){
            for (var i = 0; i <issues.length; i++){
              if (issues[i][0].title === groupName) return i;
            }
            return -1;
          }
          var addIssue = function(issues, group, issue){
            var groupId = getGroup(issues, group);
            if (groupId < 0) issues.push([issue]);
            else issues[groupId].push(issue);
          }

          github= json;

          for (var i=0 ; i < json.items.length; i++){
            var issue = json.items[i];
            var group = issue.title;

            var rep_url = issue.repository_url.split("/");
            var repository = rep_url[rep_url.length -1];
            issue.repository = repository;
            //Replace repository_url from api.github to github.com
            issue.repository_url = issue.repository_url.replace('api.', '').replace('repos/', '');

            issue.updated = new Date(issue.updated_at) > lastUpdate;
            if (issue.updated) nUpdated++;

            if (issue.user.login === myUser) {
              // do nothing, this should only show other PRs that I have to review
            } else {
              addIssue(otherPrs, group, issue);
            }
          }

          var template = $('#file-template').html();
          Mustache.parse(template);
          var otherPrsRendered = Mustache.render(template, otherPrs);

          $("#review-prs").html("<b>Review PRs</b>").append(otherPrsRendered);
          if (nUpdated > 0 ) {
            changeFavicon('favicon-red.png')

          } else {
            changeFavicon('favicon-green.png')
          }
      }
    })
  }

function report(){
  const excludedPrs = [2085] // donut
  var token = $("#token").val();

  if (!token) alert("Search requires a private token to work");


  const report = $("#today-report")
  report.html("Heading out :wave:</br>")

  report.append("In progress:</br>")
  myPrs.flatMap(a => a).filter(i => !excludedPrs.includes(i.number)).forEach( (issue) => {

    report.append(`:white_square: [${issue.title}](${issue.html_url})</br>`);
  })

  var url = "issues-search?token="+token+"&search=is:pr is:closed repo:lightdash/lightdash author:rephus";

  $.ajax({
    url: url,
    success: function(json){
      if (json.error) {
        console.error("Unable to get issues ", json.error);
        return
      }
      const yesterday = new Date(new Date().getTime() - 24*60*60*1000);
      const yesterdayEndDay = new Date(yesterday.toLocaleDateString() + " 17:20")
      const closedToday = json.items.filter(item => new Date(item.closed_at) > yesterdayEndDay)

       report.append("Closed:</br>")
      closedToday.forEach( (issue) => {
        report.append(`:white_check_mark: [${issue.title}](${issue.html_url})</br>`);
      })
    }
  })
}


/*
function groupSearch(search, group){
  var token = $("#token").val();

  if (!token) alert("Search requires a private token to work");
  if (!search) alert("Search can't be empty, eg: is:open");
  if (!token || !search) return;

  var url = "issues-search?token="+token+"&search="+search;
  var nUpdated = 0;

  $.ajax({
    url: url,
    success: function(json){
      if (json.error) {
        console.error("Unable to get issues ", json.error);
        return
      }
        var prs = [];

        var getGroup = function(issues, groupName){
          for (var i = 0; i <issues.length; i++){
            if (issues[i][0].title === groupName) return i;
          }
          return -1;
        }
        var addIssue = function(issues, group, issue){
          var groupId = getGroup(issues, group);
          if (groupId < 0) issues.push([issue]);
          else issues[groupId].push(issue);
        }

        github= json;

        for (var i=0 ; i < json.items.length; i++){
          var issue = json.items[i];
          var group = issue.title;

          var rep_url = issue.repository_url.split("/");
          var repository = rep_url[rep_url.length -1];
          issue.repository = repository;
          //Replace repository_url from api.github to github.com
          issue.repository_url = issue.repository_url.replace('api.', '').replace('repos/', '');

          issue.updated = new Date(issue.updated_at) > lastUpdate;
          if (issue.updated) nUpdated++;

          
            addIssue(prs, group, issue);
          
        }

        var template = $('#file-template').html();
        Mustache.parse(template);
        var rendered = Mustache.render(template, prs);

        $(group).html(rendered);
        if (nUpdated > 0 ) notify(nUpdated + " issues updated");
    }
  })
}*/
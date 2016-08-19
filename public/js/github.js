$(document).ready(function(){

  var myUser = "";
  var lastUpdate = new Date();

  $.ajax({
    url: 'user',
    success: function(json) {
        if (json.error) console.error("Unable to get user ", json.error);
        else myUser = json.response.name;
    }
  })
  $("#search-button").click(function(){
    var token = $("#token").val();
    var search = $("#search").val();

    if (!token) alert("Search requires a private token to work");
    if (!search) alert("Search can't be empty, eg: is:open");
    if (!token || !search) return;

    var url = "issues-search?token="+token+"&search="+search;
    $.ajax({
      url: url,
      success: function(json){
        if (json.error) {
          console.error("Unable to get issues ", json.error);
          return
        }
          var myPrs = [];
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

          lastUpdate = new Date();
      }
    })
  })

})

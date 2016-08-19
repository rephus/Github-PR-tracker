//String contains prototype
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

module.exports = {

    random: function(low,high){
      return Math.floor(Math.random() * (high - low + 1) + low);
    },
    randomArray: function(array){
      var randomIndex = this.random(0, array.length-1);
      return array[randomIndex];
    },
    probability: function(chances){
      return this.random(0,100) <= chances;
    }
};

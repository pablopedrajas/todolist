//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { urlencoded } = require("body-parser");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-pablo:Pablito12.@cluster0.f5aqh.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })

const itemsSchema = {
  name: String,

};

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome 1"
})

const item2 = new Item({
  name: "Welcome 2"
})

const item3 = new Item({
  name: "Welcome 3"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err)
        } else {
          console.log("Succesfully saved default items.")
        }
      })
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
      
        list.save()
        res.redirect("/" + customListName)
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item)
      foundList.save()
      res.redirect("/" + listName)
    })
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Succesfully deleted.")
        res.redirect("/")
      }
    })
  } else {
    List.findByIdAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    })
  }
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port " + process.env.PORT + " successfully!");
});

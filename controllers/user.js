const User = require('../models/user');
const urlRouter = require("./routes/url");
app.use("/url", urlRouter);


async function handleUserSignup(req,res){
    const {name, email, password} = req.body;
    await User.create({
        name,
        email,
        password,
    });
    return res.render("home");
}

module.exports = {
    handleUserSignup,
};
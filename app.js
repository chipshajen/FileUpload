const express = require('express')
const app = express()
const path = require("path")
const passport = require("./passportConfig")
const { PrismaSessionStore } = require("@quixo3/prisma-session-store")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const session = require("express-session")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const multer = require("multer")
const upload = multer({dest: 'uploads/'})

const {body, validationResult} = require('express-validator')


const assetsPath = path.join(__dirname, "public")
app.use(express.static(assetsPath))
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'ejs')

app.use(
    session({
        store: new PrismaSessionStore(
            new PrismaClient(),
            {
              checkPeriod: 2 * 60 * 1000,  //ms
              dbRecordIdIsSessionId: true,
              dbRecordIdFunction: undefined,
            }
          ),
        secret: 'hello',
        resave: true,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
)

app.use(passport.session())

app.use((req, res, next) => {
    res.locals.currentUser = req.user || null
    next()
})

app.get('/', (req, res) => {

    const errorMessage = req.session.errorMessage || null
    req.session.errorMessage = null

    res.render('index', {message: errorMessage})
})

app.get('/register', (req, res) => {
    res.render('signup')
})

app.post('/register', (req, res, next) => {
    const { username, password } = req.body

    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
            return next(err)
        } else {
            try {

                const matchingUser = await prisma.user.findFirst({
                    where: {
                        username: req.body.username
                    }
                })

                if(matchingUser){
                    return res.json({"msg": "already a matching user with this name"})
                }

                const newUser = await prisma.user.create({
                    data: {
                        username: req.body.username,
                        password: hashedPassword
                    }})
                req.session.successMessage = "You have successfully signed up!";
                res.redirect("/");
                

            } catch (err) {
                if (err.code === '23505') {
                    req.session.formData = {
                        username: req.body.username,
                        first: req.body.first,
                        last: req.body.last,
                        error: "Username already taken"
                    }
                    res.redirect('/')
                } else {
                    return next(err);
                }
            }
        }
    });
})

app.post("/log-in", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.session.errorMessage = info.message;
            return res.redirect("/");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect("/");
        });
    })(req, res, next);
});

  app.get("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });


  app.post("/upload", upload.single('avatar'), (req, res) => {
        console.log(req.file)
        console.log(req.body)
        res.redirect('/')
  })

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
  })
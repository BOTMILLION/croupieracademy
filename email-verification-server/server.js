const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json'); // Substitua pelo caminho correto para o arquivo JSON

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://robo-7937c.firebaseio.com' // Substitua pela URL do seu banco de dados Firebase
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'app.apostadorprime@gmail.com',
        pass: 'tbub bzbo esow quuk' // Senha do aplicativo
    }
});

// Endpoint para registro de usuário
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRecord = await auth.getUserByEmail(email).catch(() => null);

        if (userRecord) {
            return res.status(400).send('E-mail já está em uso.');
        }

        const newUserRecord = await auth.createUser({
            email: email,
            password: password,
        });
        const userId = newUserRecord.uid;

        const verificationToken = uuidv4();
        await db.collection('users').doc(userId).set({
            email: email,
            verificationToken: verificationToken,
            verified: false
        });

        const mailOptions = {
            from: 'app.apostadorprime@gmail.com',
            to: email,
            subject: 'Verificação de E-mail',
            html: `
                <html>
                <body>
                    <p>Olá!</p>
                    <p>Para completar seu cadastro, por favor, clique no link abaixo para verificar seu e-mail:</p>
                    <p><a href="http://localhost:3000/verify?token=${verificationToken}" style="color: #1a73e8;">Link de Verificação</a></p>
                    <p>Obrigado por se registrar</p>
                    <p>Atenciosamente,</p>
                    <p>Equipe Apostador Prime</p>
                </body>
                </html>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar e-mail:', error);
                return res.status(500).send('Erro ao enviar email.');
            }
            res.status(200).send('Email de verificação enviado.');
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Endpoint para verificar o e-mail
app.get('/verify', async (req, res) => {
    const { token } = req.query;
    try {
        const snapshot = await db.collection('users').where('verificationToken', '==', token).get();
        if (snapshot.empty) {
            return res.status(400).send('Token inválido.');
        }
        const userId = snapshot.docs[0].id;
        await db.collection('users').doc(userId).update({ verified: true });

        // Redireciona para a página de confirmação
        res.redirect('/confirmation.html');
    } catch (error) {
        res.status(400).send('Erro ao verificar email.');
    }
});

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

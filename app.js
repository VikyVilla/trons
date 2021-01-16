import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import path from 'path';
import helmet from 'helmet';
import logger from './src/logs/logger';
import timeout from 'express-timeout-handler';
import cors from 'cors';


const app = express();
app.use('/favicon.ico', express.static('public/img/startup.png'));
var options = {
    onTimeout: function(req, res) {
        res.status(503).send({ "message": "Service Timed out. Please retry" });
    },

    onDelayedResponse: function(req, method, args, requestTime) {
        logger.error(`Attempted to call ${method} after timeout`);
    },

    disable: ['write', 'setHeaders', 'send', 'json', 'end']
};

// disabling x-powered-by
app.disable('x-powered-by');

const init = async(req, res) => {
    // Enable proxy x-Forwadded-*
    app.enable("trust proxy");

    //set public folder as static folder for static file
    app.use('/assets', express.static(__dirname + '/public'));

    //cors policy
    app.use(cors())

    // setting timeout
    app.use(timeout.handler(options));

    // body parsing
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    // loading routes with timeout set to 25s
    await app.use('/', timeout.set(25000), require("./src/scripts"));

    // setting port
    app.set('port', (process.env.PORT || 5000));

    // starting server
    app.listen(app.get('port'), () => {
        logger.info('Server is up and running on port number ' + app.get('port'));
    });

    process.on("unhandledRejection", err => {
        logger.error(err);
        process.exit(1);
    });
    app.use(helmet());
    app.use(compression());
};

init();
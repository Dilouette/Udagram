import express, { NextFunction } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

import { Request, Response } from 'express';


(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8080;

  // Get credentials from config
  const config = require('config');
  const username = config.get('server.username');
  const password = config.get('server.password');

  // Require validator to validate url
  var validator = require('validator');
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  

  function requreAuth(req: Request, res: Response, next: NextFunction) {

    if (!req.headers || !req.headers.authorization) {
      return res.status(401).send({ message: 'Authentication required! No authorization headers in your request' });
    }
    
    const auth = {
      username: username,
      password: password,
    }

    const [, b64auth = ''] = (req.headers.authorization || '').split(' ')
    const [usr, pwd] = Buffer.from(b64auth, 'base64').toString().split(':')
    if (usr && pwd && usr === auth.username && pwd === auth.password) {
      return next()
    }
    res.set('WWW-Authenticate', 'Basic realm="401"')
    res.status(401).send('Invalid username or password')
  }

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1

  app.get( "/filteredimage", requreAuth, async ( req: Request, res: Response ) => {

    let { image_url } = req.query;

    // Check for image_url in the query string
    if (!image_url) {
      return res.status(400).send({
        success: false,
        status: 'Bad Request',
        message: `The image_url query parameter was not present. Please add image_url`
      });
    }

    // Confirm image_url is a valid URL
    if (!validator.isURL(image_url)) {
      return res.status(422).send({
        success: false,
        status: 'Unprocessible Request',
        message: `The supplied image URL is invalid. Please supply valid image URL`
      });
    }

    // Add filter to supplied image
    try {
      const filteredImage = await filterImageFromURL(image_url);

      res.sendFile(filteredImage, async (e: Error) => {
        deleteLocalFiles([filteredImage]);
        if (e) {
          res.status(500).send({
            success: false,
            status: 'Server Error',
            message: 'An unexpected exception occurred while returning the filtered image.',
            data: `${e}`,
          });
        }
      });
    } catch (e) {
      res.status(500).send({
        success: false,
        status: 'Server Error',
        message: 'An unexpected exception occurred while processing your image. Please try again' ,
        data: `${e}`,
      });
    }    
  });
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();
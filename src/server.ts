import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

import { Request, Response } from 'express';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Use basic authentication to secure endpoints
  app.use((req, res, next) => {
    const auth = {
      username: 'Optimus',
      password: 'Password@'
    }
    const [, b64auth = ''] = (req.headers.authorization || '').split(' ')
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
    if (login && password && login === auth.username && password === auth.password) {
      return next()
    }
    res.set('WWW-Authenticate', 'Basic realm="401"')
    res.status(401).send('Authentication required.')
  })

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

  app.get( "/filteredimage", async ( req: Request, res: Response ) => {

    let { image_url } = req.query;

    // Check to make sure image URL is in the query string
    if (!image_url) {
      //Respond with a bad request (400) if image_url is not found in query parameter
      return res.status(400).send({ message: "The query parameter 'image_url' was not in your request please add the 'image_url'"});
    } 

    // Filter the image from the image_url parameter
    filterImageFromURL(image_url)
      .then(filteredpath => {
        // Respond with file
        res.status(200).sendFile(filteredpath, error => {
          // Catch errors
          if (error) {
            return res.status(500).send( { message: error.message })
          }
          else {
            // Delete local file
            deleteLocalFiles([filteredpath]);
          }
        });
      })
      .catch(e => {
        return res.status(422).send( { message: e.message } );
      }); 
    
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
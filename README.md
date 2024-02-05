<a name="readme-top"></a>

![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

# Simple FEAN Webcam Recorder

![Preview 1][preview]

This is a simple webcam recorder app built using the FEAN stack (Firebase, Express.js, Angular, Node.js) and the RecordRTC library which features video webcam recording, download, and storing a recorded webcam video to the cloud (Firebase Realtime Database and Firebase Storage).

* [![Firebase][Firebase]][Firebase-url]
* [![Express][Express.js]][Express-url]
* [![Angular][Angular.io]][Angular-url]
* [![Node][Node.js]][Node-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To run the web app on your local device, please follow the steps listed below:

### Prerequisites

Before you begin, ensure you have the met the following requirements:
* [Latest version of Node.js/npm](https://nodejs.org/en/download)
* [Firebase account + created project](https://firebase.google.com/)

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/AudricSerador/FEAN-Webcam-Recorder
   ```
2. Navigate to the repo
    ```sh
    cd FEAN-Webcam-Recorder
    ```
3. Install the project dependencies
   ```sh
   npm install
   ```
4. Log into Firebase and initialize project
    ```sh
    npm install -g firebase-tools
    firebase login
    firebase init
    ```
5. Inside your Firebase project, set up Realtime Database and Storage. Use default settings when prompted.
![Preview 4][preview4]

6. Go to your project settings and generate a new private key. You should be prompted to download a JSON file.
![Preview 3][preview3]

7. Under the `src` directory, create another folder titled `environemnts` and inside paste the private key contents into a new `credentials.json` file.

8. In `src/server.js`, replace `DATABASE_URL` and `STORAGE_BUCKET` with your Firebase Realtime Database and Firebase Storage urls in your project, respectively.
    ```TypeScript
    const DATABASE_URL = 'INSERT_DATABASE_URL_HERE';
    const STORAGE_BUCKET = 'INSERT_STORAGE_BUCKET_URL_HERE';

    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL,
    storageBucket: STORAGE_BUCKET
    });
```

8. Run the file
    ```sh
    npm run start:dev
    ```
After running, an Express.js server should be running on port `8080`. To use the app, navigate to `http://localhost:4200` within your local browser.
    
<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

After giving your local browser permissions to access your camera and microphone, you should be able to record, download, and upload your videos!

![Preview 2][preview2]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

Thanks to [Outbrand](https://outbrand.ai/) for allowing me this opportunity to develop this application.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[preview]: preview_images/preview.png
[preview2]: preview_images/preview2.png
[preview3]: preview_images/preview3.png
[preview4]: preview_images/preview4.png

[Firebase]: https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase
[Firebase-url]: https://firebase.google.com/
[Express.js]: https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB
[Express-url]: https://expressjs.com/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Node.js]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/en

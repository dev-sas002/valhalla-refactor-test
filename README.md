# Working Demo

![App Demo 1](https://media.giphy.com/media/BzzQKcj6UwCI1JL5QO/giphy.gif)
![App Demo 1](https://media.giphy.com/media/uUiyPO6ai7meb5VMo0/giphy.gif)

# Technical Test
The code in this project is operational, but it was completed with very poor standard.
The client is also upset because the app is not fast enough to respond to user actions.

You're given responsibility to refactor the code and align it with the company's coding standards.
- Performance
- Maintainability
- Readability
- Testability
- DRY
- Single Responsibility Principle


## Project Description
This project is a photo sharing app where users can download any photos in the app.

The frontend relies on a legacy API that we don't have control of.
Note that the query only returns 3 items at a time.

### Features
1. Currently, the app supports 3 categories: nature, architecture, and fashion.
2. On each category, there should be 9 images loaded per page arranged as a 3 x 3 grid.
3. The user should be able to navigate to next and previous pages.
4. The user should be able to download the image after clicking the download button.

The main goal is to make the UI as smooth as possible and apply best practices in writing the frontend code.


## Things You May Do
    * Modify any existing files that are not contained in the "do-not-refactor" directory
	* Add any third-party libraries
	* Add any front-end transpilers, module bundlers, or task managers
	* Add tree-shaking on JS and CSS
	* Change and/or improve the existing UI
	* Add live reload for every file changes
	* Wrap the frontend into a Docker container (Big plus)


## Running The App
To run the app, make sure you have Node installed in your machine.
```
npm install
npm start
```
Or if you have docker, you can try
```
docker compose build
docker compose up
```
App will be available at [http://localhost:3000](http://localhost:3000)

## Updates
- Configured webpacker
- Configured babel (Transpiler)
- Configured React
- Designed UI using React functional components
- Configured docker


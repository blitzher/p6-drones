# p-6 Drones

This is a project about drones and flying them, then creating a 3D environment from videodata so that search and rescue missions would be easier.

## To run the program:

Install Node.JS and NPM with the following command:

```npm install -g npm```

Then install yarn with NPM with the following command:

```npm install -g yarn```

Now install markdownmaker to parse the index.md file into HTML with this command:

```npm i markdown-maker```

Usage of markdownmaker can be found here: https://www.npmjs.com/package/markdown-maker

Add MarkdownMaker to your path like this:

```PATH=/users/usr/dir/markdown-maker/bin:$PATH```

Now we are ready to compile and run the program.

First navigate to the project folder and through a terminal write ```yarn``` this will fetch all the necessary node-modules and build the project.

Then navigate to the "www" folder and write ```mdparse``` to parse the .md file to the HTML file and press ```ctrl + c``` to exit markdownmaker.

Then write ```yarn start``` to start up the program, and using your favourite web-browser, navigate to http://localhost:42069 to view the front end of the program.


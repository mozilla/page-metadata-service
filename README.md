# Page Metadata Service 

A simple node/express app which generates a short metadata representation of a given URL. 

## Build
[![Circle CI](https://circleci.com/gh/mozilla/page-metadata-service/tree/master.svg?style=svg)](https://circleci.com/gh/mozilla/page-metadata-service/tree/master)

# API Interface

URL Metadata
----
  Extract metadata from a provided list of URLs.

* **URL**

  https://metadata.dev.mozaws.net/v1/metadata

* **Method:**

  `POST`

*  **URL Params**

  None

* **Data Params**

  * **urls**

    The POST body must be a JSON encoded dictionary with one key: urls
    which contains a list of URLs to be queried.  A maximum of 20 URLs
    may be submitted in one request.

    ex:

        {
          urls: [
            "https://www.mozilla.org/",
            "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
          ]
        }

* **Request Headers**

  The POST body must be a JSON encoded dictionary.

  `content-type: application/json`

* **Success Response:**

  * **Code:** 200

  JSON encoding

      ex success:

        {
          error: "",
          urls: {
            http://www.mozilla.org: {
              url: "http://www.mozilla.org",
              original_url: "http://www.mozilla.org",
              provider_url: "http://www.mozilla.org",
              title: "We\u2019re building a better Internet",
              description: "Did you know? Mozilla \u2014 the maker of Firefox \u2014 fights to keep the Internet a global public resource open and accessible to all.",
              favicon_url: "http://www.mozilla.org/media/img/favicon/apple-touch-icon-180x180.00050c5b754e.png",
              images: [{
                url: "https://www.mozilla.org/media/img/home/page-image.3af4522ff5e7.png",
                entropy: 1,
                height: 500,
                width: 500
              }]
            }
          }
        }

      ex failure:

        {
          error: "The Content-Type header must be set to application/json"
          urls: {}
        }

* **Error Responses:**

  * **Code:** 400

  The server received a malformed request.  

  * **Code:** 500

  The server was unable to satisfy the request.

* **Sample Call:**

        $.ajax({
          url: "https://metadata.dev.mozaws.net/v1/metadata,
          type : "POST",
          dataType: "json",
          contentType : "application/json",
          data: JSON.stringify({
            urls: [
              'https://www.mozilla.org/',
              'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
            ]
          }),
          success : function(r, data) {
            console.log(data);
          }
        });

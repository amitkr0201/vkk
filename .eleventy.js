require('dotenv').config();
const marked = require("marked");
const contentful = require("contentful");
const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: process.env.CTFL_SPACE,
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: process.env.CTFL_ACCESSTOKEN
});

const {
    documentToHtmlString
} = require('@contentful/rich-text-html-renderer');

function imageProcessing(photo) {
    return `<img class='u-max-full-width'
            srcset="https:${photo.fields.file.url}?w=480&fm=webp&q=80&fit=fill&f=faces 480w,
            https:${photo.fields.file.url}?w=800&fm=webp&q=80&fit=fill&f=faces 800w" sizes="(max-width: 600px) 480px,800px"
            src="https:${photo.fields.file.url}?w=480&fit=fill&f=faces"
            alt="${ photo.fields.title }" loading="lazy">`;
}

module.exports = function(eleventyConfig) {

    eleventyConfig.addPassthroughCopy('assets');
    eleventyConfig.addPassthroughCopy('images');

    eleventyConfig.addShortcode('documentToHtmlString', documentToHtmlString);
    eleventyConfig.addShortcode("imageProcessing", imageProcessing);
    eleventyConfig.addShortcode("marked", marked);


    eleventyConfig.addShortcode("bannerBlock", function(bannerBlock) {
        return `
                    <section id="wrapper">
                        <header id="${bannerBlock.fields.sectionLink}">
                            <div class="inner">
                                <h2>${bannerBlock.fields.sectionTitle}</h2>
                                ${ documentToHtmlString(bannerBlock.fields.content) }
                            </div>
                        </header>
                    </section>`;
    });
    eleventyConfig.addShortcode("contentBlock", function(contentBlock) {
        return `
                    <section id="${contentBlock.fields.sectionLink}">
                        <div class="wrapper">
                            <div class="inner">
                                <h3 class="major">${contentBlock.fields.sectionTitle}</h3>
                                ${ documentToHtmlString(contentBlock.fields.content) }
                            </div>
                        </div>
                    </section>`;
    });

    eleventyConfig.addShortcode("footerBlock", function(footerBlock) {
        return `
                    <section id="footer">
                        <div class="inner">
                            <div class="copyright">
                                ${ marked(footerBlock.fields.content) }
                            </div>
                        </div>
                    </section>`;
    });

    eleventyConfig.addShortcode("listBlock", function(listBlock) {
        return `
                    <section id="contact" class="contact">
                        <div class="inner">
                            <h3 class="major">${listBlock.fields.sectionTitle}</h3>
                            ${ marked(listBlock.fields.content) }
                        </div>
                    </section>`;
    });

    eleventyConfig.addShortcode("cardBlock", async function(cardBlock) {
        const output = await Promise.all(cardBlock.fields.cards
            .map(({
                sys
            }) => {
                return cards = client.getEntry(sys.id)
                    .then((card) => {
                        const d = new Date(card.fields.date);
                        const isPast = Date.now() > d ? "past": "upcoming"
                        return `<article class=${isPast}>
                                    <a href="#" class="image">${imageProcessing(card.fields.image)}</a>
                                    <h3 class="major">${card.fields.sectionTitle}</h3>
                                    <h3 class="cardDetail link"><a href="${card.fields.bookingLink}">Click here to ${Date.now() > d? "see past event's details": "Book Tickets!"}</a></h3>
                                    <table class="cardDetail">
                                        <tr>
                                            <td class="header">Location</td>
                                            <td>${documentToHtmlString(card.fields.content)}</td>
                                        </tr>
                                        <tr>
                                            <td class="header">Date</td>
                                            <td>${d.toLocaleString([], {dateStyle: 'long', timeStyle: 'short', hour12: false})}</td>
                                        </tr>
                                    </table>
                                    <div class=${isPast}>${Date.now() > d? "Past Event": ""}</div>
                                </article>`;
                    })
            }));
        return `
                    <section id="${cardBlock.fields.sectionLink}" class="wrapper alt style1">
                        <div class="inner">
                            <h2 class="major">${cardBlock.fields.sectionTitle}</h2>
                            <section class="features">
                                ${ output.join('') }
                            </section>
                        </div>
                    </section>`;
    });

    eleventyConfig.addShortcode("imageGallery", async function(imageGallery) {
        var output = []
        var counter = 0;
        for (item of imageGallery.fields.images) {
            if (counter == 0 || counter == Math.floor(Object.keys(imageGallery.fields.images).length/2) + 1){
                output.push(`
                    <div class="gallery__column">
                `)
            }
            output.push(`
            <a href="javascript:void(0)" class="gallery__link" >
                <figure class="gallery__thumb">
                <img class="gallery__image"
                srcset="https:${item.fields.file.url}?w=480&fm=webp&q=80&fit=fill&f=faces 480w,
                https:${item.fields.file.url}?w=800&fm=webp&q=80&fit=fill&f=faces 800w" sizes="(max-width: 600px) 480px,800px"
                src="https:${item.fields.file.url}?w=480&fit=fill&f=faces"
                alt="${item.fields.title}" loading="lazy">
                    <figcaption class="gallery__caption">${item.fields.title.trim()}</figcaption>
                </figure>
            </a>
            `)
            
            // OR condition in case gallery has Odd number of images
            if ((counter > Object.keys(imageGallery.fields.images).length/2 - 1 && counter <= Object.keys(imageGallery.fields.images).length/2) || (counter == Object.keys(imageGallery.fields.images).length -1)){
                output.push(`
                    </div>
                `)
            }
            counter ++
        }
        return `
                <h2 class="imageGallery">${imageGallery.fields.title}</h2>
                <div class="imageGallery">
                    ${ output.join('') }
                </div>`;
    });

    eleventyConfig.addShortcode("featuretteBlock", function(
        featuretteBlock) {
        if(featuretteBlock.fields.imageLocation) {
            return `
                        <section id="${featuretteBlock.fields.sectionLink}" class="wrapper spotlight style1">
                            <div class="inner">
                                <a href="#" class="image">${imageProcessing(featuretteBlock.fields.image)}</a>
                                <div class="content">
                                    <h2 class="major">${featuretteBlock.fields.sectionTitle}</h2>
                                    ${ documentToHtmlString(featuretteBlock.fields.content) }
                                </div>
                            </div>
                        </section>`;
        }
        else {
            return `
                        <section id="${featuretteBlock.fields.sectionLink}" class="wrapper alt spotlight style2">
                            <div class="inner">
                                <a href="#" class="image">${imageProcessing(featuretteBlock.fields.image)}</a>
                                <div class="content">
                                    <h2 class="major">${featuretteBlock.fields.sectionTitle}</h2>
                                    ${ documentToHtmlString(featuretteBlock.fields.content) }
                                </div>
                            </div>
                        </section>`;
        }
    });

    eleventyConfig.addShortcode("youTubeGallery", async function(youTubeGallery) {
        const output = await Promise.all(youTubeGallery.fields.youTubeLinks
            .map(({
                sys
            }) => {
                return youTubeLinks = client.getEntry(sys.id)
                    .then((youTubeLink) => {
                        return `
                            <div class="embedFrameParent">
                                <iframe class="embedFrame" src="${youTubeLink.fields.youTubeUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                            </div>
                        `;
                    })
            }));
        return `
                    <section id="${youTubeGallery.fields.title}" class="embed">
                        ${ output.join('') }
                    </section>`;
    });

};

const BASE_URL = "https://api.harvardartmuseums.org";
const KEY = ""; // USE YOUR KEY HERE

//Function fetch the data from the Centuries Section
async function fetchAllCenturies() {
  const url = `${BASE_URL}/century?${KEY}&size=5&sort=temporalorder`;

  if (localStorage.getItem("centuries")) {
    return JSON.parse(localStorage.getItem("centuries"));
  }
  onFetchStart();

  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem("centuries", JSON.stringify(records));

    return records;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
}

//Function fetch the data from the Classifications Section
async function fetchAllClassifications() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;

  if (localStorage.getItem("centuries")) {
    return JSON.parse(localStorage.getItem("centuries"));
  }
  onFetchStart();

  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem("classifications", JSON.stringify(records));

    return records;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
}

async function prefetchCategoryLists() {
  onFetchStart();

  try {
    const [classifications, centuries] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies(),
    ]);
    // This provides a clue to the user, that there are items in the dropdown
    $(".classification-count").text(`(${classifications.length})`);

    classifications.forEach((classification) => {
      const classificationOption = `<option value="${classification.name}">"${classification.name}"</option>`;
      $("#select-classification").append(classificationOption);
      // append a correctly formatted option tag into
      // the element with id select-classification
    });

    // This provides a clue to the user, that there are items in the dropdown
    $(".century-count").text(`(${centuries.length}))`);

    centuries.forEach((century) => {
      const centuryOption = `<option value="${century.name}">"${century.name}"</option>`;
      $("#select-century").append(centuryOption);
      // append a correctly formatted option tag into
      // the element with id select-century
    });
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
}

function buildSearchString() {
  const classValue = $("#select-classification").val();
  const centuryValue = $("#select-century").val();
  const keywordValue = $("#keywords").val();

  const url = `${BASE_URL}/object?${KEY}&classification=${classValue}&century=${centuryValue}&keyword=${keywordValue}`;

  return url;
}

$("#search").on("submit", async function (event) {
  event.preventDefault();
  onFetchStart();

  try {
    const searchString = buildSearchString();
    const encodedUrl = encodeURI(searchString);
    const response = await fetch(encodedUrl);
    const { info, records } = await response.json();

    updatePreview(info, records);
  } catch (error) {
    console.error;
  } finally {
    onFetchEnd();
  }
});

function onFetchStart() {
  $("#loading").addClass("active");
}

function onFetchEnd() {
  $("#loading").removeClass("active");
}

function renderPreview(record) {
  const { description, primaryimageurl, title } = record;

  const previewRender = $(`<div class="object-preview">
    <a href="#">
      ${primaryimageurl ? `<img src="${primaryimageurl}" />` : ""}
      ${title ? `<h3>${title}</h3>` : ""}
      ${description ? `<h3>${description}</h3>` : ""}
    </a>
  </div>`).data("record", record);

  return previewRender;
}

function updatePreview(info, records) {
  $(".results").empty();
  const root = $("#preview");

  if (info.next) {
    $(".next").data("url", info.next).attr("disabled", false);
  } else {
    $(".next").data("url", null).attr("disabled", true);
  }

  if (info.prev) {
    $(".previous").data("url", info.prev).attr("disabled", false);
  } else {
    $(".previous").data("url", null).attr("disabled", true);
  }

  records.forEach(function (record) {
    $(".results").append(renderPreview(record));
  });
}

$("#preview .next, #preview .previous").on("click", async function () {
  onFetchStart();

  try {
    const newUrl = $(this).data("url");
    const response = await fetch(newUrl);
    const { info, records } = await response.json();

    updatePreview(info, records);
  } catch (error) {
    console.error;
  } finally {
    onFetchEnd();
  }
});

$("#preview").on("click", ".object-preview", function (event) {
  event.preventDefault();

  const objectPreview = $(this).closest(".object-preview").data("record");
  console.log(objectPreview);

  $("#feature").html(renderFeature(objectPreview));
});

$("#feature").on("click", "a", async function (event) {
  const anchor = $(this).attr("href");

  if (href.startsWith("mailto")) {
    return;
  }

  event.preventDefault();

  onFetchStart();

  try {
    const response = await fetch(anchor);
    const { info, records } = await response.json();

    updatePreview(info, records);
  } catch (error) {
    console.error;
  } finally {
    onFetchEnd();
  }
});

function renderFeature(record) {
  const {
    title,
    dated,
    description,
    culture,
    style,
    technique,
    medium,
    dimensions,
    people,
    department,
    division,
    contact,
    creditline,
    images,
    primaryimageurl,
  } = record;

  return $(`<div class="object-feature">
  <header>
    ${title ? `<h3>${title}</h3>` : ""}
    ${dated ? `<h4>${dated}</h4>` : ""}
  </header>
  <section class="facts">
    ${factHTML("Description", description, "culture")}
    ${factHTML("Culture", culture, "culture")}
    ${factHTML("Style", style, "style")}
    ${factHTML("Technique", technique, "technique")}
    ${factHTML("Medium", medium, "medium")}
    ${factHTML("Dimensions", dimensions, "dimensions")}
    ${
      people
        ? people
            .map(function (person) {
              return factHTML("Person", person.displayname, "person");
            })
            .join("")
        : ""
    }
    ${factHTML("Department", department, "department")}
    ${factHTML("Division", division, "division")}
    ${factHTML(
      "Contact",
      `<a target="_blank" href="mailto:${contact}">${contact}</a>`
    )}
    ${factHTML("Creditline", creditline, "creditline")}
  </section>
  <section class="photos">
    ${photosHTML(images, primaryimageurl)}
  </section>
</div>`);
}

function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

function factHTML(title, content, searchTerm = null) {
  if (!content) {
    return "";
  } else if (!searchTerm) {
    return `<span class="title">${title}</span>
    <span class="content">${content}</span>`;
  } else {
    return `<span class="title">${title}</span>
    <span class="content"><a href="${searchURL(
      searchTerm,
      content
    )}">${content}</a></span>`;
  }
}

function photosHTML(images, primaryimageurl) {
  if (images && images.length > 0) {
    return images
      .map(function (image) {
        return `<img src="${image.baseimageurl}" />`;
      })
      .join("");
  } else if (primaryimageurl) {
    return `<img src="${primaryimageurl}" />`;
  } else {
    return "";
  }
}

prefetchCategoryLists();

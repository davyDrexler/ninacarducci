(function($) {
  $.fn.mauGallery = function(options) {
    options = $.extend($.fn.mauGallery.defaults, options);
    const tagsCollection = [];

    this.each(function() {
      const $gallery = $(this);
      $.fn.mauGallery.methods.createRowWrapper($gallery);

      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox($gallery, options.lightboxId, options.navigation);
      }

      $.fn.mauGallery.listeners(options);

      $gallery.children(".gallery-item").each(function() {
        const $item = $(this);
        $.fn.mauGallery.methods.responsiveImageItem($item);
        $.fn.mauGallery.methods.moveItemInRowWrapper($item);
        $.fn.mauGallery.methods.wrapItemInColumn($item, options.columns);

        const theTag = $item.data("gallery-tag");
        if (options.showTags && theTag !== undefined && !tagsCollection.includes(theTag)) {
          tagsCollection.push(theTag);
        }
      });

      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags($gallery, options.tagsPosition, tagsCollection);
      }

      $gallery.fadeIn(500);
    });

    return this;
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.listeners = function(options) {
    $(".gallery-item").on("click", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () => $.fn.mauGallery.methods.prevImage(options.lightboxId));
    $(".gallery").on("click", ".mg-next", () => $.fn.mauGallery.methods.nextImage(options.lightboxId));
  };

  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },
    wrapItemInColumn(element, columns) {
      let columnClasses = '';
      if (typeof columns === 'number') {
        columnClasses = ` col-${Math.ceil(12 / columns)}`;
      } else if (typeof columns === 'object') {
        columnClasses += columns.xs ? ` col-${Math.ceil(12 / columns.xs)}` : '';
        columnClasses += columns.sm ? ` col-sm-${Math.ceil(12 / columns.sm)}` : '';
        columnClasses += columns.md ? ` col-md-${Math.ceil(12 / columns.md)}` : '';
        columnClasses += columns.lg ? ` col-lg-${Math.ceil(12 / columns.lg)}` : '';
        columnClasses += columns.xl ? ` col-xl-${Math.ceil(12 / columns.xl)}` : '';
      } else {
        console.error(`Columns should be defined as numbers or objects. ${typeof columns} is not supported.`);
      }
      element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
    },
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid").attr("loading", "lazy");
      }
    },
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`).find(".lightboxImage").attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    prevImage(lightboxId) {
      const activeImageSrc = $(`#${lightboxId}`).find(".lightboxImage").attr("src");
      const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      const imagesCollection = $.fn.mauGallery.methods.getFilteredImages(activeTag);

      const activeIndex = imagesCollection.findIndex(img => img.attr("src") === activeImageSrc);
      const prevImage = imagesCollection[activeIndex - 1] || imagesCollection[imagesCollection.length - 1];
      $(`#${lightboxId}`).find(".lightboxImage").attr("src", prevImage.attr("src"));
    },
    nextImage(lightboxId) {
      const activeImageSrc = $(`#${lightboxId}`).find(".lightboxImage").attr("src");
      const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      const imagesCollection = $.fn.mauGallery.methods.getFilteredImages(activeTag);

      const activeIndex = imagesCollection.findIndex(img => img.attr("src") === activeImageSrc);
      const nextImage = imagesCollection[activeIndex + 1] || imagesCollection[0];
      $(`#${lightboxId}`).find(".lightboxImage").attr("src", nextImage.attr("src"));
    },
    getFilteredImages(tag) {
      const imagesCollection = [];
      $(".item-column img.gallery-item").each(function() {
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          imagesCollection.push($(this));
        }
      });
      return imagesCollection;
    },
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`
        <div class="modal fade" id="${lightboxId || 'galleryLightbox'}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body">
                ${navigation ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>' : ''}
                <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                ${navigation ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">></div>' : ''}
              </div>
            </div>
          </div>
        </div>`);
    },
    showItemTags(gallery, position, tags) {
      let tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>';
      tags.forEach(tag => {
        tagItems += `<li class="nav-item"><span class="nav-link" data-images-toggle="${tag}">${tag}</span></li>`;
      });
      const tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    filterByTag() {
      if ($(this).hasClass("active-tag")) return;

      $(".active.active-tag").removeClass("active active-tag");
      $(this).addClass("active-tag active");

      const tag = $(this).data("images-toggle");

      $(".gallery-item").each(function() {
        const $parent = $(this).parents(".item-column");
        $parent.hide();
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          $parent.show(300);
        }
      });
    }
  };
})(jQuery);

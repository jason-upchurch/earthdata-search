# EDSC-88 As a user, I want to view point spatial extents on a map so that I may
#         understand the location and shape of my results

require "spec_helper"

describe "Granule footprint visualizations", reset: false, wait: 30 do
  extend Helpers::DatasetHelpers

  before :all do
    visit "/search"
  end

  context "for single point datasets" do


    use_dataset 'C179003030-ORNL_DAAC', '15 Minute Stream Flow Data'

    context "visualizing a dataset" do
      hook_visualization

      it "draws a single point on the map representing all of the dataset's granules" do
        expect(page).to have_css('.leaflet-overlay-pane path', count: 1)
      end

      it "pans and zooms the map to the rendered point" do
        expect(page).to have_css('.leaflet-overlay-pane path', count: 1)
        zoom = page.evaluate_script("$('#map').data('map').map.getZoom()")
        expect(zoom).to be(7)
      end
    end

    context "removing a visualized dataset" do
      hook_visualization_removal

      it "hides the dataset's visualizations" do
        expect(page).to have_no_css('.leaflet-overlay-pane path')
      end
    end
  end

  context "for multi-point datasets" do
    use_dataset 'C1000000080-CDDIS', 'CDDIS_DORIS_products_stcd'

    context "visualizing a dataset" do
      hook_visualization

      it "draws points on the map for the dataset's unique granule points" do
        expect(page).to have_css('.leaflet-overlay-pane path', count: 57)
      end

      it "pans and zooms the map to encompass the dataset's points" do
        expect(page).to have_css('.leaflet-overlay-pane path', count: 57)
        zoom = page.evaluate_script("$('#map').data('map').map.getZoom()")
        expect(zoom).to be(1)
      end
    end

    context "removing a visualized dataset" do
      hook_visualization_removal

      it "hides the dataset's visualizations" do
        expect(page).to have_no_css('.leaflet-overlay-pane path')
      end
    end
  end
end

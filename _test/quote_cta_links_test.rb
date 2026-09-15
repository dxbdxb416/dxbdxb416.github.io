# frozen_string_literal: true

require "fileutils"
require "minitest/autorun"
require "open3"
require "tmpdir"

class QuoteCtaLinksTest < Minitest::Test
  CAL_LINK = "https://cal.com/d3dot/30min"
  WHATSAPP_LINK = "https://wa.me/971509733299"

  def self.build_site
    return @destination if @destination

    destination = Dir.mktmpdir("d3-site-test-")
    stdout, stderr, status = Open3.capture3(
      { "JEKYLL_NO_BUNDLER_REQUIRE" => "true" },
      "jekyll", "build", "--destination", destination
    )
    raise "Jekyll build failed:\n#{stdout}\n#{stderr}" unless status.success?

    @destination = destination
    at_exit { FileUtils.remove_entry(@destination) if File.exist?(@destination) }
    @destination
  end

  def page(path)
    File.read(File.join(self.class.build_site, path))
  end

  def hrefs_for_class(html, class_name)
    html.scan(/<a\b[^>]*class="[^"]*\b#{Regexp.escape(class_name)}\b[^"]*"[^>]*>/)
        .map { |anchor| anchor[/\bhref="([^"]+)"/, 1] }
  end

  def test_primary_homepage_quote_buttons_book_a_meeting
    %w[en/index.html ar/index.html].each do |path|
      hrefs = hrefs_for_class(page(path), "home2-pcta")

      assert_equal 4, hrefs.length, "expected four main quote buttons on #{path}"
      assert_equal [CAL_LINK], hrefs.uniq, "all main quote buttons should book a meeting on #{path}"
    end
  end

  def test_service_page_quote_buttons_book_a_meeting
    service_paths = %w[
      en/accounting-erp/index.html en/crm/index.html en/automation/index.html
      en/websites/index.html en/noon-amazon/index.html
      ar/accounting-erp/index.html ar/crm/index.html ar/automation/index.html
      ar/websites/index.html ar/noon-amazon/index.html
    ]

    service_paths.each do |path|
      hrefs = hrefs_for_class(page(path), "btn-primary")
      assert_includes hrefs, CAL_LINK, "service quote button should book a meeting on #{path}"
    end
  end

  def test_floating_whatsapp_button_stays_on_whatsapp
    %w[en/index.html ar/index.html].each do |path|
      assert_equal [WHATSAPP_LINK], hrefs_for_class(page(path), "whatsapp-float")
    end
  end
end

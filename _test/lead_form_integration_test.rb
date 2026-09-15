# frozen_string_literal: true

require "fileutils"
require "minitest/autorun"
require "open3"
require "tmpdir"

class LeadFormIntegrationTest < Minitest::Test
  WORKER_ENDPOINT = "https://api.d3dot.space/lead"

  def self.build_site
    return @destination if @destination

    destination = Dir.mktmpdir("d3-lead-form-test-")
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

  def test_bilingual_home_forms_post_to_the_worker_without_a_public_access_key
    %w[en/index.html ar/index.html].each do |path|
      html = page(path)

      assert_includes html, %(action="#{WORKER_ENDPOINT}"), path
      assert_includes html, "data-lead-form", path
      refute_includes html, 'name="access_key"', path
      assert_includes html, 'name="subject" value="New website enquiry — D3"', path
      assert_includes html, 'name="from_name" value="D3 Website"', path
      assert_includes html, 'name="botcheck"', path
      assert_includes html, 'class="form-status" role="status" aria-live="polite"', path
    end
  end

  def test_bilingual_forms_keep_the_same_visible_business_fields
    expected_fields = %w[name email company phone service message]

    %w[en/index.html ar/index.html].each do |path|
      html = page(path)
      expected_fields.each do |field|
        assert_includes html, %(name="#{field}"), "#{field} missing from #{path}"
      end
    end
  end
end

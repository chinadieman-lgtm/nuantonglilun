from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--no-sandbox"],
        )
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:8080/index.html", wait_until="networkidle")
        page.wait_for_selector(".card", timeout=5000)

        # Click multi-choice filter
        page.click(".seg-btn[data-type='多选题']")
        page.wait_for_timeout(500)
        page.wait_for_selector(".card", timeout=5000)

        badge = page.text_content(".badge")
        q_text = page.text_content(".question-text")
        print(f"[1] 题型: {badge}, 题目: {q_text[:50]}...")

        options = page.query_selector_all(".option")
        print(f"[2] 选项数: {len(options)}")

        # Test 1: Click option A - should toggle selection
        opt_a = page.query_selector('.option[data-opt="A"]')
        assert opt_a, "Option A not found"
        box = opt_a.bounding_box()
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(200)

        sel1 = page.query_selector_all(".option.selected")
        print(f"[3] 点击A后选中数: {len(sel1)}")
        a_cls = opt_a.get_attribute("class") or ""
        print(f"[4] A的class: {a_cls}")

        # Test 2: Click option B - should add to selection (multi)
        opt_b = page.query_selector('.option[data-opt="B"]')
        assert opt_b, "Option B not found"
        box_b = opt_b.bounding_box()
        page.mouse.click(box_b["x"] + box_b["width"] / 2, box_b["y"] + box_b["height"] / 2)
        page.wait_for_timeout(200)

        sel2 = page.query_selector_all(".option.selected")
        print(f"[5] 再点击B后选中数: {len(sel2)}")

        a_sel = "selected" in (opt_a.get_attribute("class") or "")
        b_sel = "selected" in (opt_b.get_attribute("class") or "")
        print(f"[6] A选中: {a_sel}, B选中: {b_sel}")

        # Test 3: Click A again to deselect
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(200)

        sel3 = page.query_selector_all(".option.selected")
        print(f"[7] 取消A后选中数: {len(sel3)}")

        # Test 4: Submit
        opt_a.click()
        opt_b.click()
        page.wait_for_timeout(200)
        submit = page.query_selector("#submitBtn")
        if submit.is_enabled():
            submit.click()
            page.wait_for_timeout(300)
            result = page.query_selector(".result")
            if result:
                print(f"[8] 结果显示: {result.text_content()[:100]}")
                print(f"[9] 结果类: {result.get_attribute('class')}")
        else:
            print("[8] 提交按钮被禁用")

        page.screenshot(path=r"D:\暖通高级\codex制作刷题软件\test_fixed.png")
        print("[10] 测试完成")
        browser.close()


if __name__ == "__main__":
    main()
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--no-sandbox"],
        )
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:8080/index.html", wait_until="networkidle")
        page.wait_for_selector(".card", timeout=5000)

        # Click multi-choice filter
        page.click(".seg-btn[data-type='多选题']")
        page.wait_for_timeout(500)
        page.wait_for_selector(".card", timeout=5000)

        badge = page.text_content(".badge")
        q_text = page.text_content(".question-text")
        print(f"[1] 题型: {badge}, 题目: {q_text[:50]}...")

        options = page.query_selector_all(".option")
        print(f"[2] 选项数: {len(options)}")

        # Test 1: Click option A - should toggle selection
        opt_a = page.query_selector('.option[data-opt="A"]')
        assert opt_a, "Option A not found"
        box = opt_a.bounding_box()
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(200)

        sel1 = page.query_selector_all(".option.selected")
        print(f"[3] 点击A后选中数: {len(sel1)}")
        a_cls = opt_a.get_attribute("class") or ""
        print(f"[4] A的class: {a_cls}")

        # Test 2: Click option B - should add to selection (multi)
        opt_b = page.query_selector('.option[data-opt="B"]')
        assert opt_b, "Option B not found"
        box_b = opt_b.bounding_box()
        page.mouse.click(box_b["x"] + box_b["width"] / 2, box_b["y"] + box_b["height"] / 2)
        page.wait_for_timeout(200)

        sel2 = page.query_selector_all(".option.selected")
        print(f"[5] 再点击B后选中数: {len(sel2)}")

        a_sel = "selected" in (opt_a.get_attribute("class") or "")
        b_sel = "selected" in (opt_b.get_attribute("class") or "")
        print(f"[6] A选中: {a_sel}, B选中: {b_sel}")

        # Test 3: Click A again to deselect
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(200)

        sel3 = page.query_selector_all(".option.selected")
        print(f"[7] 取消A后选中数: {len(sel3)}")

        # Test 4: Select and submit
        opt_a.click()
        opt_b.click()
        page.wait_for_timeout(200)
        submit = page.query_selector("#submitBtn")
        if submit.is_enabled():
            submit.click()
            page.wait_for_timeout(300)
            result = page.query_selector(".result")
            if result:
                print(f"[8] 结果显示: {result.text_content()[:100]}")
                print(f"[9] 结果类: {result.get_attribute('class')}")
        else:
            print("[8] 提交按钮被禁用")

        page.screenshot(path=r"D:\暖通高级\codex制作刷题软件\test_fixed.png")
        print("[10] 测试完成")
        browser.close()


if __name__ == "__main__":
    main()

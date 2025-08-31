(() => {
    const tableBody = document.querySelector("#purchaseLinesTable tbody");
    const addBtn = document.getElementById("addLineBtn");
    const products = JSON.parse(document.getElementById("productsData")?.textContent || "[]");

    if (!tableBody || !addBtn) {
        return;
    }

    const productOptions = products
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    const createRow = (index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><select class="form-select" name="Lines[${index}].ProductId" required>${productOptions}</select></td>
            <td><input class="form-control" name="Lines[${index}].Quantity" type="number" min="1" value="1" required /></td>
            <td><input class="form-control" name="Lines[${index}].UnitPrice" type="number" min="0" step="0.01" required /></td>
            <td><button type="button" class="btn btn-sm btn-outline-danger">Remove</button></td>
        `;

        const productSelect = tr.querySelector(`select[name='Lines[${index}].ProductId']`);
        const unitPriceInput = tr.querySelector(`input[name='Lines[${index}].UnitPrice']`);

        const setDefaults = () => {
            const selectedId = Number(productSelect.value);
            const found = products.find(x => x.id === selectedId);
            if (!found) {
                return;
            }
            unitPriceInput.value = found.purchasePrice;
        };

        productSelect.addEventListener("change", setDefaults);
        tr.querySelector("button").addEventListener("click", () => {
            tr.remove();
            normalizeIndexes();
        });

        setDefaults();
        return tr;
    };

    const normalizeIndexes = () => {
        [...tableBody.querySelectorAll("tr")].forEach((row, idx) => {
            row.querySelectorAll("input,select").forEach((input) => {
                input.name = input.name.replace(/Lines\[\d+\]/, `Lines[${idx}]`);
            });
        });
    };

    addBtn.addEventListener("click", () => {
        tableBody.appendChild(createRow(tableBody.querySelectorAll("tr").length));
    });

    addBtn.click();
})();

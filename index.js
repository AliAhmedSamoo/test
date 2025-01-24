const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { default: axios } = require("axios");
const cors = require("cors");
const app = express();
const port = 5000;
app.use(cors())
app.use(express.json({ limit: '50mb', extended: true }));



var token2222 = ""
async function taketoken3() {

    let data = JSON.stringify({
        "email": "partner@enbiosis.com",
        "password": "partner123",
        "userType": "partner"
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api-staging.enbiosis.com/v1/login',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': 'enbiosis_session=LYcevQn5DWN7wWmbSqzwJO6aAcm0WlI6e5Dwewcw'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            token2222 = response.data.access_token;
            return response.data.access_token
        })
        .catch((error) => {
            console.log(error);
        });

}


taketoken3()

app.get("/",async(req,res)=>{

    res.send("sdfg")
})



app.post("/generate-pdf", async (req, res) => {
    const { kitcode } = req.body;
    const dates = Date.now();

    console.log(kitcode)

    try {
        // const url = "https://spacegutlatest.web.app/" + kitcode; // Target URL
        const url = "https://spacegutlatest.web.app/SGDEMO"; // Target URL

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.CHROMIUM_PATH || '/app/.chrome-for-testing/chrome-linux64/chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--headless',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        await page.waitForSelector('#ali', { visible: true });

        // Introduce a delay (if needed)
        // await new Promise((resolve) => setTimeout(resolve, 20000));

        // Generate PDF as a Buffer
         const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }, // Remove margins
        });

    

        await browser.close();
      



        const tempFilePath = `${kitcode}-microbiome-analysis-report-${dates}.pdf`;

        await fs.writeFileSync(tempFilePath, pdfBuffer);


        // Upload to API (optional, uncomment if needed)
        const FormData = require("form-data");
        const data = new FormData();
        data.append("slug", "microbiome-analysis-report");
        data.append("file", fs.createReadStream(tempFilePath));
        const config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `https://api-staging.enbiosis.com/v1/kits/${kitcode}/uploadReport`,
            headers: {
                ...data.getHeaders(),
                "Authorization": `Bearer ${token2222}`,
            },
            data: data,
        };

        await axios.request(config)
            .then(response => {
                fs.unlinkSync(tempFilePath);
                res.status(200).json(response.data)
            
            })
            .catch(error => {
                fs.unlinkSync(tempFilePath);
                console.error("Error uploading PDF:", error.response?.data || error.message);
                res.status(500).json({ error: "Upload failed", details: error.response?.data || error.message });
            });

        // Clean up temporary file
      
        // res.status(200).send("test");

    } catch (error) {
        console.error("Error generating or uploading PDF:", error);
        res.status(500).json({
            error: "Failed to generate or upload PDF.",
            details: error.message,
        });
    }
});




app.listen(1338, '0.0.0.0', () => {
  console.log('Server is running on port 1338');
});


